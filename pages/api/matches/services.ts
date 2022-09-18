import shuffle from "lodash.shuffle";
import { InformationCardsOnMatches, Player } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  InformationCardStatus,
  Phases,
  PlayerStatus,
  Role,
} from "@/types/index";
import { OptionInClient } from "@/types/client";
import { getRoles, pickInfoCards } from "./utils";
import { MAX_ROUNDS } from "@/constants/index";
import { BadTimingException, PermissionsException } from "./exceptions";

export async function createGame(userId: number, roomId: number) {
  const { hostId, matchesId, users } = await prisma.room.findUniqueOrThrow({
    where: { id: roomId },
    include: {
      users: true,
    },
  });

  if (matchesId) {
    throw new Error("对局已存在");
  }

  if (hostId !== userId) {
    throw new PermissionsException("只有房主能开始游戏");
  }

  if (users.some((user) => !user.isReady)) {
    throw new BadTimingException("有用户还未准备");
  }

  const shuffledMeasureCards = await prisma.measureCard
    .findMany()
    .then((res) => shuffle(res));

  const shuffledClueCards = await prisma.clueCard
    .findMany()
    .then((res) => shuffle(res));

  const pickedInfoCards = await prisma.informationCard.findMany().then((res) =>
    pickInfoCards(res).map((card, index) => ({
      order: index + 1,
      status: InformationCardStatus.Show,
      informationCard: {
        connect: {
          id: card.id,
        },
      },
    }))
  );

  const roles: Role[] = shuffle(getRoles(users.length));

  const players: Omit<Player, "matchesId" | "id">[] = users.map(
    (item, index) => {
      const role = roles[index];
      return {
        userId: item.userId,
        role: role,
        measureCards: {
          create:
            role === Role.Witness
              ? []
              : shuffledMeasureCards.splice(0, 4).map(({ name }) => ({
                  measureCard: { connect: { name } },
                })),
        },
        clueCards: {
          create:
            role === Role.Witness
              ? []
              : shuffledClueCards.splice(0, 4).map(({ name }) => ({
                  clueCard: { connect: { name } },
                })),
        },
        status: PlayerStatus.NotReady,
        remainingNumOfSolveCase: role === Role.Witness ? 0 : 1,
        remainingNumOfAccomplice: role === Role.Accomplice ? 1 : 0,
      };
    }
  );

  const newMatches = await prisma.matches.create({
    data: {
      roomId,
      phases: Phases.Init,
      rounds: 1,
      currentPlayerIndex: 0,
      informationCards: { create: pickedInfoCards },
      players: { create: players },
    },
  });

  await prisma.room.update({
    where: {
      id: roomId,
    },
    data: {
      matchesId: newMatches.id,
    },
  });

  return newMatches;
}

export async function getDetailById(id: number) {
  const matches = await prisma.matches.findUniqueOrThrow({
    where: {
      id,
    },
    include: {
      informationCards: {
        orderBy: {
          order: "asc",
        },
        include: {
          informationCard: {
            include: {
              list: true,
            },
          },
        },
      },
      players: {
        include: {
          user: true,
          measureCards: {
            include: {
              measureCard: true,
            },
          },
          clueCards: {
            include: {
              clueCard: true,
            },
          },
        },
      },
      options: {
        orderBy: {
          order: "asc",
        },
        include: {
          option: true,
        },
      },
    },
  });
  return matches;
}

export async function readyForGame(playerId: number, matchesId: number) {
  const matches = await prisma.matches.update({
    where: { id: matchesId },
    data: {
      players: {
        update: {
          where: { id: playerId },
          data: {
            status: PlayerStatus.Ready,
          },
        },
      },
    },
    include: {
      players: {
        include: {
          user: true,
          measureCards: {
            include: {
              measureCard: true,
            },
          },
          clueCards: {
            include: {
              clueCard: true,
            },
          },
        },
      },
    },
  });
  return matches;
}

export async function startGame(matchesId: number) {
  const { phases } = await prisma.matches.findUniqueOrThrow({
    where: { id: matchesId },
  });

  if (phases !== Phases.Init) {
    throw new BadTimingException("游戏已经开始");
  }
  const matches = await prisma.matches.update({
    where: {
      id: matchesId,
    },
    data: {
      phases: Phases.Murder,
    },
    include: {
      players: {
        include: {
          user: true,
          measureCards: {
            include: {
              measureCard: true,
            },
          },
          clueCards: {
            include: {
              clueCard: true,
            },
          },
        },
      },
    },
  });
  return matches;
}

export async function murder(matchesId: number, measure: string, clue: string) {
  return await prisma.matches.update({
    where: { id: matchesId },
    data: {
      measure,
      clue,
      phases: Phases.ProvideTestimonials,
    },
  });
}

// 提供信息
export async function pointOutInformation(
  playerId: number,
  matchesId: number,
  options: OptionInClient[]
) {
  const { phases, players } = await getDetailById(matchesId);

  if (phases !== Phases.ProvideTestimonials) {
    throw new BadTimingException("当前不是提供作案信息阶段");
  }

  const player = players.find((player) => player.id === playerId);

  if (!player) {
    throw new PermissionsException("该玩家不在此游戏中");
  }

  if (player.role !== Role.Witness) {
    throw new PermissionsException("只有目击者才能提供作案信息");
  }

  const newOptions = options.map((option, index) => ({
    indexOnCard: option.indexOnCard,
    order: index + 1,
    option: {
      connect: {
        weight: option.weight,
      },
    },
  }));

  const matches = await prisma.matches.update({
    where: { id: matchesId },
    data: {
      phases: Phases.Reasoning,
      options: {
        create: newOptions,
      },
    },
    include: {
      options: {
        orderBy: {
          order: "asc",
        },
        include: {
          option: true,
        },
      },
    },
  });
  return matches;
}

// 补充信息
export async function replenishInfo({
  playerId,
  matchesId,
  informationCards,
  options,
}: {
  playerId: number;
  matchesId: number;
  informationCards: Omit<InformationCardsOnMatches, "matcheId">[];
  options: OptionInClient[];
}) {
  const { phases, players } = await getDetailById(matchesId);

  if (phases !== Phases.AdditionalTestimonials) {
    throw new BadTimingException("当前不是补充作案信息阶段");
  }

  const player = players.find((player) => player.id === playerId);

  if (!player) {
    throw new PermissionsException("该玩家不在此游戏中");
  }

  if (player.role !== Role.Witness) {
    throw new PermissionsException("只有目击者才能补充作案信息");
  }

  // 更新信息卡的状态和顺序
  for (const card of informationCards) {
    await prisma.informationCardsOnMatches.update({
      where: {
        informationCardId_matcheId: {
          informationCardId: card.informationCardId,
          matcheId: matchesId,
        },
      },
      data: {
        order: card.order,
        status: card.status,
      },
    });
  }

  // 更新指示物的位置
  for (const option of options) {
    await prisma.optionsOnMatches.update({
      where: {
        optionWeight_matchesId: {
          optionWeight: option.weight,
          matchesId,
        },
      },
      data: {
        indexOnCard: option.indexOnCard,
      },
    });
  }

  // 更新游戏阶段
  const matches = await prisma.matches.update({
    where: {
      id: matchesId,
    },
    data: {
      phases: Phases.Reasoning,
    },
    include: {
      informationCards: {
        orderBy: {
          order: "asc",
        },
        include: {
          informationCard: {
            include: {
              list: true,
            },
          },
        },
      },
      options: {
        orderBy: {
          order: "asc",
        },
        include: {
          option: true,
        },
      },
    },
  });

  return matches;
}

// 破案
export async function solveCase({
  matchesId,
  playerId,
  measure,
  clue,
  currentPlayerIndex,
}: {
  matchesId: number;
  playerId: number;
  measure: string;
  clue: string;
  currentPlayerIndex: number;
}) {
  const matches = await prisma.matches.findUniqueOrThrow({
    where: {
      id: matchesId,
    },
    include: {
      players: true,
    },
  });

  // 只有在推理阶段才能破案
  if (matches.phases !== Phases.Reasoning) {
    throw new BadTimingException("只有在推理阶段才能破案");
  }

  // 只有在该玩家自己的的回合才能破案
  if (matches.currentPlayerIndex !== currentPlayerIndex) {
    throw new BadTimingException("只有在该玩家自己的的回合才能破案");
  }

  const player = matches.players.find((player) => player.id === playerId);

  if (!player) {
    throw new PermissionsException("该玩家不在此游戏中");
  }

  if (player.role === Role.Witness) {
    throw new PermissionsException("目击者无法破案");
  }

  if (player.remainingNumOfSolveCase === 0) {
    throw new BadTimingException("可用的破案次数不足");
  }

  const newMatches = await prisma.matches.update({
    where: {
      id: matchesId,
    },
    data: {
      phases:
        matches.measure === measure && matches.clue === clue
          ? Phases.DetectiveWin
          : matches.phases,
      players: {
        update: {
          where: {
            id: playerId,
          },
          data: {
            remainingNumOfSolveCase: {
              decrement: 1,
            },
          },
        },
      },
    },
    include: {
      players: {
        include: {
          user: true,
          measureCards: {
            include: {
              measureCard: true,
            },
          },
          clueCards: {
            include: {
              clueCard: true,
            },
          },
        },
      },
    },
  });
  return newMatches;
}

// 结束这一回合
export async function endThisTurn(
  playerId: number,
  matchesId: number,
  currentPlayerIndex: number
) {
  const matches = await prisma.matches.findUniqueOrThrow({
    where: { id: matchesId },
    include: {
      players: true,
    },
  });
  const { players, rounds, phases } = matches;

  if (phases !== Phases.Reasoning) {
    throw new BadTimingException("只有在推理阶段才能破案");
  }

  if (currentPlayerIndex !== matches.currentPlayerIndex) {
    throw new BadTimingException("只有在该玩家自己的的回合才能破案");
  }

  const player = matches.players.find((player) => player.id === playerId);

  if (!player) {
    throw new PermissionsException("该玩家不在此游戏中");
  }

  if (player.role === Role.Witness) {
    throw new PermissionsException("目击者无法破案");
  }

  const isLastSpeaker = matches.currentPlayerIndex === players.length - 2;
  const data: {
    phases?: Phases;
    rounds?: number;
    currentPlayerIndex?: number;
  } = {};
  if (!isLastSpeaker) {
    // 如果不是最后一位发言的玩家结束自己的回合，只需要将发言人改变成下一位玩家
    data.currentPlayerIndex = matches.currentPlayerIndex + 1;
  } else {
    // 如果最后一位发言的玩家结束自己的回合，需要将游戏推进到下一轮，并且将发言人重置为第一位玩家
    data.rounds = Math.min(rounds + 1, MAX_ROUNDS);
    data.currentPlayerIndex = 0;
    // 当最后一轮的最后一位发言的玩家结束了自己的回合，凶手会获得胜利
    if (rounds === MAX_ROUNDS) {
      data.phases = Phases.MurdererWin;
    } else if (players.length > 5) {
      // 人数超过五个有帮凶
      data.phases = Phases.Accomplice;
    } else {
      data.phases = Phases.AdditionalTestimonials;
      await addNewInfoCards(matchesId);
    }
  }

  const newMatches = await prisma.matches.update({
    where: { id: matchesId },
    data: data,
    include: {
      informationCards: {
        orderBy: {
          order: "asc",
        },
        include: {
          informationCard: {
            include: {
              list: true,
            },
          },
        },
      },
    },
  });

  return newMatches;
}

export async function addNewInfoCards(matchesId: number) {
  const infoCards = await prisma.informationCardsOnMatches.findMany({
    where: {
      matcheId: matchesId,
    },
  });
  const restInfoCards = await prisma.informationCard.findMany({
    where: {
      categoryName: {
        notIn: ["死亡原因", "案发地点"],
      },
      id: {
        notIn: infoCards.map((card) => card.informationCardId),
      },
    },
  });
  const newCard = shuffle(restInfoCards)[0];
  const matches = await prisma.matches.update({
    where: { id: matchesId },
    data: {
      informationCards: {
        create: [
          {
            status: InformationCardStatus.Pending,
            order: infoCards.length + 1,
            informationCard: {
              connect: {
                id: newCard.id,
              },
            },
          },
        ],
      },
    },
    include: {
      informationCards: {
        orderBy: {
          order: "asc",
        },
        include: {
          informationCard: {
            include: {
              list: true,
            },
          },
        },
      },
    },
  });
  return matches;
}

export async function deleteMatchesById(id: number) {
  await prisma.measureCardsOnPlayers.deleteMany({
    where: {
      player: {
        matchesId: id,
      },
    },
  });
  await prisma.clueCardsOnPlayers.deleteMany({
    where: {
      player: {
        matchesId: id,
      },
    },
  });

  const { roomId } = await prisma.matches.update({
    where: {
      id,
    },
    data: {
      players: {
        deleteMany: {},
      },
      informationCards: {
        deleteMany: {},
      },
      options: {
        deleteMany: {},
      },
    },
  });
  await prisma.room.update({
    where: {
      id: roomId,
    },
    data: {
      matches: {
        delete: true,
      },
      matchesId: null,
    },
  });
}

export async function quitGame(playerId: number, matchesId: number) {
  const matches = await prisma.matches.update({
    where: {
      id: matchesId,
    },
    data: {
      players: {
        update: {
          where: {
            id: playerId,
          },
          data: {
            status: PlayerStatus.Leave,
          },
        },
      },
    },
    include: {
      players: {
        include: {
          user: true,
          measureCards: {
            include: {
              measureCard: true,
            },
          },
          clueCards: {
            include: {
              clueCard: true,
            },
          },
        },
      },
    },
  });
  if (matches.players.every((player) => player.status === PlayerStatus.Leave)) {
    await deleteMatchesById(matchesId);
  } else {
    return matches;
  }
}

export async function endingGame() {}
