import { Server, Socket } from "socket.io";
import {
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
  ClientEnterRoomHander,
  ClientGameReady,
  ClientChangeReadyStateHander,
  ClientLeaveRoomHander,
  ClientCreateGameHander,
  ClientToServerEvents,
  ClientGameMurderHander,
  ClientGamePointOutInformation,
  ClientGameReplenishInformation,
  ClientGameSolveCase,
  ClientGameQuit,
  ClientGameNextSpeaker,
} from "@/lib/socket";

import {
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
  ACTION_CONNECT_ROOM,
  ACTION_DISCONNECT_ROOM,
  BCST_CHANGE_READY_STATE,
  BCST_GAME_ALL_PLAYER_READY,
  BCST_GAME_DESTROYED,
  BCST_GAME_STATE_UPDATE,
  BCST_START_GAME,
  BCST_UPDATE_USERS_IN_ROOM,
} from "@/lib/socket/constants";

import * as roomServices from "../room/services";
import * as matchesServices from "../matches/services";
import { PlayerStatus } from "@/types/index";

export const socketConnectionHander = (
  socket: Socket<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >,
  io: Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >
) => {
  const joinWsRoom = (roomId: number) => {
    if (!socket.rooms.has(String(roomId))) {
      socket.join(String(roomId));
    }
  };

  const leaveWsRoom = (roomId: number) => {
    if (socket.rooms.has(String(roomId))) {
      socket.leave(String(roomId));
    }
  };

  const enterRoom: ClientEnterRoomHander = async (userId, roomId) => {
    try {
      const result = await roomServices.enterRoom(userId, roomId);
      io.to(String(roomId)).emit(BCST_UPDATE_USERS_IN_ROOM, {
        users: result.users,
      });
    } catch (error) {
      console.log("enter error", error);
    }
  };

  const leaveRoom: ClientLeaveRoomHander = async (userId, roomId) => {
    try {
      const result = await roomServices.leaveRoom(userId, roomId);
      if (result) {
        io.to(String(roomId)).emit(BCST_UPDATE_USERS_IN_ROOM, {
          users: result.users,
        });
      }
    } catch (error) {
      console.log("leave error", error);
    }
  };

  const changeUserReadyState: ClientChangeReadyStateHander = async (
    userId,
    isReady
  ) => {
    try {
      const userInRoom = await roomServices.changeUserReadyState(
        userId,
        isReady
      );
      io.to(String(userInRoom.roomId)).emit(BCST_CHANGE_READY_STATE, {
        userId: userInRoom.userId,
        isReady: userInRoom.isReady,
      });
    } catch (error) {
      console.log("leave error", error);
    }
  };

  const createGame: ClientCreateGameHander = async (userId, roomId) => {
    try {
      const { id } = await matchesServices.createGame(userId, roomId);
      io.to(String(roomId)).emit(BCST_START_GAME, { id });
    } catch (error) {
      console.error(error);
    }
  };

  const readyForGame: ClientGameReady = async (playerId, roomId, matchesId) => {
    try {
      const matches = await matchesServices.readyForGame(playerId, matchesId);
      const isAllPlayersReady = matches.players.every(
        ({ status }) => status === PlayerStatus.Ready
      );
      if (!isAllPlayersReady) {
        io.to(String(roomId)).emit(BCST_GAME_STATE_UPDATE, matches);
      } else {
        const MS = 15000;
        io.to(String(roomId)).emit(BCST_GAME_ALL_PLAYER_READY, MS / 1000);
        setTimeout(async () => {
          const matches = await matchesServices.startGame(matchesId);
          io.to(String(roomId)).emit(BCST_GAME_STATE_UPDATE, matches);
        }, MS);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const murderInGame: ClientGameMurderHander = async ({
    userId,
    roomId,
    matchesId,
    measure,
    clue,
  }) => {
    try {
      const matches = await matchesServices.murder(matchesId, measure, clue);
      console.log("socket exit in room", socket.rooms.has(String(roomId)));
      io.to(String(roomId)).emit(BCST_GAME_STATE_UPDATE, matches);
    } catch (error) {
      console.error(error);
    }
  };

  const pointOutInformation: ClientGamePointOutInformation = async ({
    userId,
    roomId,
    matchesId,
    options,
  }) => {
    try {
      const matches = await matchesServices.pointOutInformation(
        matchesId,
        options
      );
      io.to(String(roomId)).emit(BCST_GAME_STATE_UPDATE, matches);
    } catch (error) {
      console.error(error);
    }
  };

  const replenishInfo: ClientGameReplenishInformation = async ({
    userId,
    roomId,
    matchesId,
    informationCards,
    options,
  }) => {
    try {
      const matches = await matchesServices.replenishInfo({
        matchesId,
        informationCards,
        options,
      });
      io.to(String(roomId)).emit(BCST_GAME_STATE_UPDATE, matches);
    } catch (error) {
      console.error(error);
    }
  };

  const solveCase: ClientGameSolveCase = async ({
    userId,
    roomId,
    matchesId,
    playerId,
    measure,
    clue,
  }) => {
    try {
      const matches = await matchesServices.solveCase({
        matchesId,
        playerId,
        measure,
        clue,
      });
      io.to(String(roomId)).emit(BCST_GAME_STATE_UPDATE, matches);
    } catch (error) {
      console.error(error);
    }
  };

  const endThisTurn: ClientGameNextSpeaker = async ({
    userId,
    roomId,
    matchesId,
    ...payload
  }) => {
    try {
      const matches = await matchesServices.endThisTurn(
        matchesId,
        payload.currentPlayerIndex
      );
      io.to(String(roomId)).emit(BCST_GAME_STATE_UPDATE, matches);
    } catch (error) {
      console.error(error);
    }
  };

  const accomplice = async () => {};

  const quitGame: ClientGameQuit = async (playerId, roomId, matchesId) => {
    try {
      const matches = await matchesServices.quitGame(playerId, matchesId);
      if (matches) {
        io.to(String(roomId)).emit(BCST_GAME_STATE_UPDATE, matches);
      } else {
        io.to(String(roomId)).emit(BCST_GAME_DESTROYED);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // 用户加入到websocket房间
  socket.on(ACTION_CONNECT_ROOM, joinWsRoom);

  // 用户从websocket房间离开
  socket.on(ACTION_DISCONNECT_ROOM, leaveWsRoom);

  // 用户进入房间
  socket.on(ACTION_ENTER_ROOM, enterRoom);

  // 用户离开房间
  socket.on(ACTION_LEAVE_ROOM, leaveRoom);

  // 用户准备状态改变
  socket.on(ACTION_CHANGE_READY_STATE, changeUserReadyState);

  // 创建一局新游戏
  socket.on(ACTION_CREATE_GAME, createGame);

  socket.on(ACTION_GAME_READY, readyForGame);

  // 凶手行凶
  socket.on(ACTION_GAME_MURDER, murderInGame);

  // 目击者提供信息
  socket.on(ACTION_GAME_PROVIDE_TESTIMONIALS, pointOutInformation);

  // 目击者补充信息
  socket.on(ACTION_GAME_ADDITIONAL_TESTIMONIALS, replenishInfo);

  // 破案
  socket.on(ACTION_GAME_SOLVE_CASE, solveCase);

  // 帮凶
  socket.on(ACTION_GAME_ACCOMPLICE, accomplice);

  // 退出游戏
  socket.on(ACTION_GAME_QUIT, quitGame);

  // 结束本次发言
  socket.on(ACTION_GAME_NEXT_SPEAKER, endThisTurn);
};
