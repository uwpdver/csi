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
  // 用户加入到websocket房间
  const joinWsRoom = (roomId: number) => {
    if (!socket?.rooms.has(String(roomId))) {
      socket?.join(String(roomId));
    }
  };

  // 用户从websocket房间离开
  const leaveWsRoom = (roomId: number) => {
    if (socket?.rooms.has(String(roomId))) {
      socket?.leave(String(roomId));
    }
  };

  // 用户进入房间
  const enterRoom: ClientEnterRoomHander = async (userId, roomId) => {
    const room = await roomServices.enterRoom(userId, roomId);
    io?.to(String(roomId)).emit(BCST_UPDATE_USERS_IN_ROOM, {
      users: room.users,
    });
  };

  // 用户离开房间
  const leaveRoom: ClientLeaveRoomHander = async (userId, roomId) => {
    const room = await roomServices.leaveRoom(userId, roomId);
    if (room) {
      io?.to(String(roomId)).emit(BCST_UPDATE_USERS_IN_ROOM, {
        users: room.users,
      });
    }
  };

  // 用户准备状态改变
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

  // 创建一局新游戏
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

  // 凶手行凶
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

  // 目击者提供信息
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

  // 目击者补充信息
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

  // 破案
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

  // 结束本次发言
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

  // 帮凶
  const accomplice = async () => {};

  // 退出游戏
  const quitGame: ClientGameQuit = async (playerId, roomId, matchesId) => {
    const matches = await matchesServices.quitGame(playerId, matchesId);
    if (matches) {
      io?.to(String(roomId)).emit(BCST_GAME_STATE_UPDATE, matches);
    } else {
      io?.to(String(roomId)).emit(BCST_GAME_DESTROYED);
    }
  };

  const catchError = (fn: Function) => {
    return function (...args: any[]) {
      try {
        const result = fn.apply(null, args);
        if (result instanceof Promise) {
          return result.catch((error) => {
            if (error instanceof Error) {
              socket.emit(BCST_ERROR, { message: error.message });
            }
          });
        } else {
          return result;
        }
      } catch (error) {
        if (error instanceof Error) {
          socket.emit(BCST_ERROR, { message: error.message });
        }
      }
    };
  };

  socket.on(ACTION_CONNECT_ROOM, catchError(joinWsRoom));
  socket.on(ACTION_DISCONNECT_ROOM, catchError(leaveWsRoom));
  socket.on(ACTION_ENTER_ROOM, catchError(enterRoom));
  socket.on(ACTION_LEAVE_ROOM, catchError(leaveRoom));
  socket.on(ACTION_CHANGE_READY_STATE, catchError(changeUserReadyState));
  socket.on(ACTION_CREATE_GAME, catchError(createGame));
  socket.on(ACTION_GAME_READY, catchError(readyForGame));
  socket.on(ACTION_GAME_MURDER, catchError(murderInGame));
  socket.on(ACTION_GAME_PROVIDE_TESTIMONIALS, catchError(pointOutInformation));
  socket.on(ACTION_GAME_ADDITIONAL_TESTIMONIALS, catchError(replenishInfo));
  socket.on(ACTION_GAME_SOLVE_CASE, catchError(solveCase));
  socket.on(ACTION_GAME_ACCOMPLICE, catchError(accomplice));
  socket.on(ACTION_GAME_QUIT, catchError(quitGame));
  socket.on(ACTION_GAME_NEXT_SPEAKER, catchError(endThisTurn));
}
