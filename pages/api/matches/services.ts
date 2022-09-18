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
    throw new Error("权限不足");
  }

  if (users.some((user) => !user.isReady)) {
    throw new Error("有用户未准备");
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
  await prisma.player.update({
    where: { id: playerId },
    data: {
      status: PlayerStatus.Ready,
    },
  });
  const matches = await prisma.matches.findUniqueOrThrow({
    where: { id: matchesId },
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
  try {
    const { phases } = await prisma.matches.findUniqueOrThrow({
      where: { id: matchesId },
    });

    if (phases !== Phases.Init) {
      throw new Error("游戏已经开始");
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
  } catch (error) {
    console.error(error);
  }
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

export async function pointOutInformation(
  matchesId: number,
  options: OptionInClient[]
) {
  const matches = await prisma.matches.update({
    where: { id: matchesId },
    data: {
      phases: Phases.Reasoning,
      options: {
        create: options.map((option, index) => ({
          indexOnCard: option.indexOnCard,
          order: index + 1,
          option: {
            connect: {
              weight: option.weight,
            },
          },
        })),
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

export async function replenishInfo({
  matchesId,
  informationCards,
  options,
}: {
  matchesId: number;
  informationCards: Omit<InformationCardsOnMatches, "matcheId">[];
  options: OptionInClient[];
}) {
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

export async function solveCase({
  matchesId,
  playerId,
  measure,
  clue,
}: {
  matchesId: number;
  playerId: number;
  measure: string;
  clue: string;
}) {
  const matches = await prisma.matches.findUniqueOrThrow({
    where: {
      id: matchesId,
    },
    include: {
      players: true,
    },
  });

  if (matches.phases !== Phases.Reasoning) {
    throw new Error("时机不当");
  }

  if (
    matches.players.find((player) => player.id === playerId)
      ?.remainingNumOfSolveCase === 0
  ) {
    throw new Error("没有可用的破案次数");
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

export async function endThisTurn(
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
    throw new Error("时机不当");
  }

  if (currentPlayerIndex !== matches.currentPlayerIndex) {
    throw new Error("时机不当");
  }

  const isLastSpeaker = matches.currentPlayerIndex === players.length - 2;
  const data: {
    phases?: Phases;
    rounds?: number;
    currentPlayerIndex?: number;
    informationCards?: any;
  } = {};
  if (!isLastSpeaker) {
    data.currentPlayerIndex = matches.currentPlayerIndex + 1;
  } else {
    // 一轮推理结束
    const MAX_ROUNDS = 3;
    data.currentPlayerIndex = 0;
    data.rounds = Math.min(rounds + 1, MAX_ROUNDS);

    if (rounds === MAX_ROUNDS) {
      data.phases = Phases.MurdererWin;
    } else if (players.length > 5) {
      // 人数超过五个有帮凶
      data.phases = Phases.Accomplice;
    } else {
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
      data.informationCards = {
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
      };
      data.phases = Phases.AdditionalTestimonials;
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
