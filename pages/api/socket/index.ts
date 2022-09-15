import type { NextApiRequest, NextApiResponse } from "next";
import { Server } from "socket.io";
import shuffle from "lodash.shuffle";
import { Player } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { getRoles } from "@/utils/getRoles";
import { pickInfoCards } from "@/utils/pickInfoCards";

import { deleteMatchesById, getMatchesById } from "pages/api/matches/[id]";

import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  ClientGameReplenishInformation,
} from "@/types/socket";
import {
  InformationCardStatus,
  Phases,
  PlayerStatus,
  Role,
} from "@/types/index";

import {
  BCST_UPDATE_USERS_IN_ROOM,
  BCST_CHANGE_READY_STATE,
  BCST_START_GAME,
  BCST_GAME_STATE_UPDATE,
  ACTION_ENTER_ROOM,
  ACTION_LEAVE_ROOM,
  ACTION_CHANGE_READY_STATE,
  ACTION_GAME_SOLVE_CASE,
  ACTION_GAME_ACCOMPLICE,
  ACTION_GAME_ADDITIONAL_TESTIMONIALS,
  ACTION_GAME_MURDER,
  ACTION_GAME_NEXT_SPEAKER,
  ACTION_GAME_PROVIDE_TESTIMONIALS,
  ACTION_CREATE_GAME,
  ACTION_GAME_READY,
  ACTION_GAME_QUIT,
  BCST_GAME_ALL_PLAYER_READY,
  ACTION_CONNECT_ROOM,
  ACTION_DISCONNECT_ROOM,
  BCST_GAME_DESTROYED,
} from "@/constants/index";

type Response = NextApiResponse & {
  socket: NextApiResponse["socket"] & {
    server: any;
  };
};

export const changeUserReadyState = async (
  userId: number,
  isReady: boolean
) => {
  const result = await prisma.userInRoom.update({
    where: {
      userId,
    },
    data: {
      isReady,
    },
  });
  return result;
};

export const addUserToRoom = async (userId: number, roomId: number) => {
  const room = await prisma.room.findUnique({
    where: {
      id: roomId,
    },
    include: {
      users: true,
    },
  });
  if (room) {
    if (room.users.find((user) => userId === user.userId)) {
      throw new Error("you are aready in the room");
    } else {
      const result = await prisma.room.update({
        where: {
          id: roomId,
        },
        data: {
          users: {
            create: [
              {
                userId,
                isReady: false,
              },
            ],
          },
        },
        include: {
          users: {
            include: {
              user: true,
            },
          },
        },
      });
      return result;
    }
  } else {
    throw new Error("room doest not exsit");
  }
};

export const removeUserToRoom = async (userId: number, roomId: number) => {
  const room = await prisma.room.findUnique({
    where: {
      id: roomId,
    },
    include: {
      users: true,
    },
  });
  if (room) {
    const result = await prisma.room.update({
      where: {
        id: roomId,
      },
      data: {
        users: {
          deleteMany: {
            userId,
          },
        },
      },
      include: {
        users: {
          include: {
            user: true,
          },
        },
      },
    });
    return result;
  } else {
    throw new Error("room doest not exsit");
  }
};

export const createGame = async (roomId: number) => {
  const { users } = await prisma.room.findUniqueOrThrow({
    where: {
      id: roomId,
    },
    include: {
      users: true,
    },
  });

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

  const roles = shuffle(getRoles(users.length));

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
};

export const replenishInfo: ClientGameReplenishInformation = async ({
  userId,
  roomId,
  matchesId,
  informationCards,
  options,
}) => {
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

  await prisma.matches.update({
    where: {
      id: matchesId,
    },
    data: {
      phases: Phases.Reasoning,
    },
  });
};

const SocketHandler = (req: NextApiRequest, res: Response) => {
  if (res.socket.server.io) {
    console.log("Socket is already running");
  } else {
    console.log("Socket is initializing");
    const io = new Server<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >(res.socket.server);
    res.socket.server.io = io;
    io.on("connection", (socket) => {
      // 用户进入房间
      socket.on(ACTION_ENTER_ROOM, async (userId, roomId) => {
        try {
          const result = await addUserToRoom(userId, roomId);
          io.to(String(roomId)).emit(BCST_UPDATE_USERS_IN_ROOM, {
            users: result.users,
          });
        } catch (error) {
          console.log("enter error", error);
        }
      });

      // 用户离开房间
      socket.on(ACTION_LEAVE_ROOM, async (userId, roomId) => {
        try {
          const result = await removeUserToRoom(userId, roomId);
          const room = await prisma.room.findUniqueOrThrow({
            where: {
              id: roomId,
            },
            include: {
              users: true,
            },
          });
          if (room.users.length === 0) {
            await prisma.room.delete({
              where: {
                id: roomId,
              },
            });
          } else if (room.hostId === userId) {
            await prisma.room.update({
              where: {
                id: roomId,
              },
              data: {
                host: {
                  connect: {
                    id: room.users[0].userId,
                  },
                },
              },
            });
          }
          io.to(String(roomId)).emit(BCST_UPDATE_USERS_IN_ROOM, {
            users: result.users,
          });
        } catch (error) {
          console.log("leave error", error);
        }
      });

      // 用户准备状态改变
      socket.on(ACTION_CHANGE_READY_STATE, async (userId, isReady) => {
        const userInRoom = await changeUserReadyState(userId, isReady);
        try {
          io.to(String(userInRoom.roomId)).emit(BCST_CHANGE_READY_STATE, {
            userId: userInRoom.userId,
            isReady: userInRoom.isReady,
          });
        } catch (error) {
          console.log("leave error", error);
        }
      });

      socket.on(ACTION_CREATE_GAME, async (userId, roomId) => {
        try {
          const { hostId, matchesId, users } =
            await prisma.room.findUniqueOrThrow({
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
          const { id } = await createGame(roomId);
          io.to(String(roomId)).emit(BCST_START_GAME, { id });
        } catch (error) {
          console.error(error);
        }
      });

      socket.on(ACTION_CONNECT_ROOM, async (roomId) => {
        if (!socket.rooms.has(String(roomId))) {
          socket.join(String(roomId));
        }
      });

      socket.on(ACTION_DISCONNECT_ROOM, async (roomId) => {
        if (socket.rooms.has(String(roomId))) {
          socket.leave(String(roomId));
        }
      });

      socket.on(ACTION_GAME_READY, async (playerId, roomId, matchesId) => {
        try {
          await prisma.player.update({
            where: { id: playerId },
            data: {
              status: PlayerStatus.Ready,
            },
          });
          const matches = await prisma.matches.findUniqueOrThrow({
            where: { id: matchesId },
            include: { players: true },
          });
          const isAllPlayersReady = matches.players.every(
            ({ status }) => status === PlayerStatus.Ready
          );
          if (isAllPlayersReady && matches.phases === Phases.Init) {
            const MS = 15000;
            io.to(String(roomId)).emit(BCST_GAME_ALL_PLAYER_READY, MS / 1000);
            setTimeout(async () => {
              const { phases } = await prisma.matches.findUniqueOrThrow({
                where: { id: matchesId },
              });
              if (phases === Phases.Init) {
                await prisma.matches.update({
                  where: {
                    id: matchesId,
                  },
                  data: {
                    phases: Phases.Murder,
                  },
                });
                const newMatches = await getMatchesById(matchesId);
                io.to(String(roomId)).emit(BCST_GAME_STATE_UPDATE, newMatches);
              }
            }, MS);
          }
          io.to(String(roomId)).emit(BCST_START_GAME, matches);
        } catch (error) {
          console.error(error);
        }
      });

      // 凶手行凶
      socket.on(
        ACTION_GAME_MURDER,
        async ({ userId, roomId, matchesId, measure, clue }) => {
          await prisma.matches.update({
            where: { id: matchesId },
            data: {
              measure,
              clue,
              phases: Phases.ProvideTestimonials,
            },
          });
          const newMatchesState = await getMatchesById(matchesId);
          io.to(String(roomId)).emit(BCST_GAME_STATE_UPDATE, newMatchesState);
        }
      );

      // 目击者提供信息
      socket.on(
        ACTION_GAME_PROVIDE_TESTIMONIALS,
        async ({ userId, roomId, matchesId, options }) => {
          await prisma.matches.update({
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
          });
          const newMatchesState = await getMatchesById(matchesId);
          io.to(String(roomId)).emit(BCST_GAME_STATE_UPDATE, newMatchesState);
        }
      );

      // 目击者补充信息
      socket.on(
        ACTION_GAME_ADDITIONAL_TESTIMONIALS,
        async ({ userId, roomId, matchesId, informationCards, options }) => {
          await replenishInfo({
            userId,
            roomId,
            matchesId,
            informationCards,
            options,
          });
          const newMatchesState = await getMatchesById(matchesId);
          io.to(String(roomId)).emit(BCST_GAME_STATE_UPDATE, newMatchesState);
        }
      );

      // 破案
      socket.on(
        ACTION_GAME_SOLVE_CASE,
        async ({ userId, roomId, matchesId, playerId, measure, clue }) => {
          const matches = await prisma.matches.findUniqueOrThrow({
            where: {
              id: matchesId,
            },
          });
          if (matches.phases !== Phases.Reasoning) {
            return null;
          }
          await prisma.player.update({
            where: {
              id: playerId,
            },
            data: {
              remainingNumOfSolveCase: {
                decrement: 1,
              },
            },
          });
          if (matches.measure === measure && matches.clue === clue) {
            await prisma.matches.update({
              where: {
                id: matchesId,
              },
              data: { phases: Phases.DetectiveWin },
            });
          }
          const newMatchesState = await getMatchesById(matchesId);
          io.to(String(roomId)).emit(BCST_GAME_STATE_UPDATE, newMatchesState);
        }
      );

      // 帮凶
      socket.on(
        ACTION_GAME_ACCOMPLICE,
        async ({ userId, roomId, matchesId }) => {
          // io.to(String(roomId)).emit(BCST_GAME_STATE_UPDATE, {});
        }
      );

      socket.on(ACTION_GAME_QUIT, async (playerId, roomId, matchesId) => {
        await prisma.player.update({
          where: {
            id: playerId,
          },
          data: {
            status: PlayerStatus.Leave,
          },
        });
        const players = await prisma.player.findMany({
          where: {
            matchesId,
          },
        });
        if (players.every((player) => player.status === PlayerStatus.Leave)) {
          await deleteMatchesById(matchesId);
          io.to(String(roomId)).emit(BCST_GAME_DESTROYED);
        }
      });

      // 结束本次发言
      socket.on(
        ACTION_GAME_NEXT_SPEAKER,
        async ({ userId, roomId, matchesId }) => {
          const matches = await prisma.matches.findUniqueOrThrow({
            where: { id: matchesId },
            include: {
              players: true,
            },
          });
          const { currentPlayerIndex, players, rounds } = matches;
          const isLastSpeaker = currentPlayerIndex === players.length - 2;
          const data: {
            phases?: Phases;
            rounds?: number;
            currentPlayerIndex?: number;
            informationCards?: any;
          } = {};
          if (!isLastSpeaker) {
            data.currentPlayerIndex = currentPlayerIndex + 1;
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
              const infoCards = await prisma.informationCardsOnMatches.findMany(
                {
                  where: {
                    matcheId: matchesId,
                  },
                }
              );
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
          await prisma.matches.update({
            where: { id: matchesId },
            data: data,
          });
          const newMatchesState = await getMatchesById(matchesId);
          io.to(String(roomId)).emit(BCST_GAME_STATE_UPDATE, newMatchesState);
        }
      );
    });

    io.of("/").adapter.on("join-room", (room, id) => {
      console.log(`socket ${id} has joined room ${room}`);
    });

    io.of("/").adapter.on("leave-room", (room, id) => {
      console.log(`socket ${id} has joined room ${room}`);
    });
  }
  res.end();
};

export default SocketHandler;
