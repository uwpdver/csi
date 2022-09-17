import { User, UserInRoom } from "@prisma/client";
import { MatchesInClient } from "@/types/client";
import {
  BCST_CHANGE_READY_STATE,
  BCST_GAME_STATE_UPDATE,
  BCST_START_GAME,
  BCST_UPDATE_USERS_IN_ROOM,
  BCST_GAME_ALL_PLAYER_READY,
  BCST_GAME_DESTROYED,
} from "@/constants/index";

// 服务端发送给客户端的事件
export type ServerUpdateUsersInRoom = ({
  users,
}: {
  users: (UserInRoom & {
    user: User;
  })[];
}) => void;

export type ServerChangeReadyStateHander = (data: {
  userId: number;
  isReady: boolean;
}) => void;

export type ServerStartGameHander = (data: { id: number }) => void;

export type ServerDefaultHander = (data: any) => void;

export type ServerGameStateUpdate = (data: MatchesInClient) => void;

export type ServerGameAllPlayerReady = (s: number) => void;

export type ServerGameDestroyed = () => void;

export interface ServerToClientEvents {
  [BCST_UPDATE_USERS_IN_ROOM]: ServerUpdateUsersInRoom;
  [BCST_CHANGE_READY_STATE]: ServerChangeReadyStateHander;
  [BCST_START_GAME]: ServerStartGameHander;
  [BCST_GAME_STATE_UPDATE]: ServerGameStateUpdate;
  [BCST_GAME_ALL_PLAYER_READY]: ServerGameAllPlayerReady;
  [BCST_GAME_DESTROYED]: ServerGameDestroyed;
}