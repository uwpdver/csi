import { Server, Socket } from "socket.io";
import {
  InterServerEvents,
  SocketData,
  ServerToClientEvents,
  ClientToServerEvents,
  ClientEnterRoomHander,
  ClientLeaveRoomHander,
  ClientChangeReadyStateHander,
  ClientCreateGameHander,
  ClientGameReady,
  ClientGameMurderHander,
  ClientGamePointOutInformation,
  ClientGameReplenishInformation,
  ClientGameSolveCase,
  ClientGameNextSpeaker,
  ClientGameQuit,
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
  BCST_ERROR,
} from "@/lib/socket/constants";

import { PlayerStatus } from "@/types/index";
import { isAsyncFunction } from "util/types";
import * as roomServices from "../room/services";
import * as matchesServices from "../matches/services";

export function socketController(
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
) {
  const joinWsRoom = (roomId: number) => {
    if (!socket?.rooms.has(String(roomId))) {
      socket?.join(String(roomId));
    }
  };

  const leaveWsRoom = (roomId: number) => {
    if (socket?.rooms.has(String(roomId))) {
      socket?.leave(String(roomId));
    }
  };

  const enterRoom: ClientEnterRoomHander = async (userId, roomId) => {
    const room = await roomServices.enterRoom(userId, roomId);
    io?.to(String(roomId)).emit(BCST_UPDATE_USERS_IN_ROOM, {
      users: room.users,
    });
  };

  const leaveRoom: ClientLeaveRoomHander = async (userId, roomId) => {
    const room = await roomServices.leaveRoom(userId, roomId);
    if (room) {
      io?.to(String(roomId)).emit(BCST_UPDATE_USERS_IN_ROOM, {
        users: room.users,
      });
    }
  };

  const changeUserReadyState: ClientChangeReadyStateHander = async (
    userId,
    isReady
  ) => {
    const userInRoom = await roomServices.changeUserReadyState(userId, isReady);
    io?.to(String(userInRoom.roomId)).emit(BCST_CHANGE_READY_STATE, {
      userId: userInRoom.userId,
      isReady: userInRoom.isReady,
    });
  };

  const createGame: ClientCreateGameHander = async (userId, roomId) => {
    const { id } = await matchesServices.createGame(userId, roomId);
    io?.to(String(roomId)).emit(BCST_START_GAME, { id });
  };

  const readyForGame: ClientGameReady = async (playerId, roomId, matchesId) => {
    const matches = await matchesServices.readyForGame(playerId, matchesId);
    const isAllPlayersReady = matches.players.every(
      ({ status }) => status === PlayerStatus.Ready
    );
    if (!isAllPlayersReady) {
      io?.to(String(roomId)).emit(BCST_GAME_STATE_UPDATE, matches);
    } else {
      const MS = 15000;
      io?.to(String(roomId)).emit(BCST_GAME_ALL_PLAYER_READY, MS / 1000);
      setTimeout(async () => {
        const matches = await matchesServices.startGame(matchesId);
        io?.to(String(roomId)).emit(BCST_GAME_STATE_UPDATE, matches);
      }, MS);
    }
  };

  const murderInGame: ClientGameMurderHander = async ({
    userId,
    roomId,
    matchesId,
    measure,
    clue,
  }) => {
    const matches = await matchesServices.murder(matchesId, measure, clue);
    io?.to(String(roomId)).emit(BCST_GAME_STATE_UPDATE, matches);
  };

  const pointOutInformation: ClientGamePointOutInformation = async ({
    userId,
    roomId,
    playerId,
    matchesId,
    options,
  }) => {
    const matches = await matchesServices.pointOutInformation(
      playerId,
      matchesId,
      options
    );
    io?.to(String(roomId)).emit(BCST_GAME_STATE_UPDATE, matches);
  };

  const replenishInfo: ClientGameReplenishInformation = async ({
    userId,
    roomId,
    playerId,
    matchesId,
    informationCards,
    options,
  }) => {
    const matches = await matchesServices.replenishInfo({
      playerId,
      matchesId,
      informationCards,
      options,
    });
    io?.to(String(roomId)).emit(BCST_GAME_STATE_UPDATE, matches);
  };

  const solveCase: ClientGameSolveCase = async ({
    userId,
    roomId,
    matchesId,
    playerId,
    measure,
    clue,
    currentPlayerIndex,
  }) => {
    const matches = await matchesServices.solveCase({
      matchesId,
      playerId,
      measure,
      clue,
      currentPlayerIndex,
    });
    io?.to(String(roomId)).emit(BCST_GAME_STATE_UPDATE, matches);
  };

  const endThisTurn: ClientGameNextSpeaker = async ({
    userId,
    roomId,
    playerId,
    matchesId,
    ...payload
  }) => {
    const matches = await matchesServices.endThisTurn(
      playerId,
      matchesId,
      payload.currentPlayerIndex
    );
    io?.to(String(roomId)).emit(BCST_GAME_STATE_UPDATE, matches);
  };

  const accomplice = async () => {};

  const quitGame: ClientGameQuit = async (playerId, roomId, matchesId) => {
    const matches = await matchesServices.quitGame(playerId, matchesId);
    if (matches) {
      io?.to(String(roomId)).emit(BCST_GAME_STATE_UPDATE, matches);
    } else {
      io?.to(String(roomId)).emit(BCST_GAME_DESTROYED);
    }
  };

  const catchError = (fn: Function) => {
    if (isAsyncFunction(fn)) {
      return async function (...args: any) {
        try {
          return await fn.apply(null, args);
        } catch (error) {
          if (error instanceof Error) {
            socket.emit(BCST_ERROR, { message: error.message });
          }
        }
      };
    } else {
      return function (...args: any) {
        try {
          return fn.apply(null, args);
        } catch (error) {
          if (error instanceof Error) {
            socket.emit(BCST_ERROR, { message: error.message });
          }
        }
      };
    }
  };

  // 用户加入到websocket房间
  socket.on(ACTION_CONNECT_ROOM, catchError(joinWsRoom));

  // 用户从websocket房间离开
  socket.on(ACTION_DISCONNECT_ROOM, catchError(leaveWsRoom));

  // 用户进入房间
  socket.on(ACTION_ENTER_ROOM, catchError(enterRoom));

  // 用户离开房间
  socket.on(ACTION_LEAVE_ROOM, catchError(leaveRoom));

  // 用户准备状态改变
  socket.on(ACTION_CHANGE_READY_STATE, catchError(changeUserReadyState));

  // 创建一局新游戏
  socket.on(ACTION_CREATE_GAME, catchError(createGame));

  socket.on(ACTION_GAME_READY, catchError(readyForGame));

  // 凶手行凶
  socket.on(ACTION_GAME_MURDER, catchError(murderInGame));

  // 目击者提供信息
  socket.on(ACTION_GAME_PROVIDE_TESTIMONIALS, catchError(pointOutInformation));

  // 目击者补充信息
  socket.on(ACTION_GAME_ADDITIONAL_TESTIMONIALS, catchError(replenishInfo));

  // 破案
  socket.on(ACTION_GAME_SOLVE_CASE, catchError(solveCase));

  // 帮凶
  socket.on(ACTION_GAME_ACCOMPLICE, catchError(accomplice));

  // 退出游戏
  socket.on(ACTION_GAME_QUIT, catchError(quitGame));

  // 结束本次发言
  socket.on(ACTION_GAME_NEXT_SPEAKER, catchError(endThisTurn));
}
