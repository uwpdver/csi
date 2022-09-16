import {
  ACTION_CHANGE_READY_STATE,
  ACTION_CREATE_GAME,
  ACTION_ENTER_ROOM,
  ACTION_LEAVE_ROOM,

  ACTION_GAME_ACCOMPLICE,
  ACTION_GAME_ADDITIONAL_TESTIMONIALS,
  ACTION_GAME_MURDER,
  ACTION_GAME_NEXT_SPEAKER,
  ACTION_GAME_PROVIDE_TESTIMONIALS,
  ACTION_GAME_SOLVE_CASE,
  ACTION_GAME_READY,
  
  BCST_CHANGE_READY_STATE,
  BCST_GAME_STATE_UPDATE,
  BCST_START_GAME,
  BCST_UPDATE_USERS_IN_ROOM,
  BCST_GAME_ALL_PLAYER_READY,
  ACTION_GAME_QUIT,
  ACTION_CONNECT_ROOM,
  ACTION_DISCONNECT_ROOM,
  BCST_GAME_DESTROYED,
} from "../constants";
import { InformationCardsOnMatches, User, UserInRoom } from "@prisma/client";
import { MatchesInClient, OptionInClient } from "@/types/client";

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

export type ServerGameAllPlayerReady = (s:number) => void;

export type ServerGameDestroyed = () => void;

export interface ServerToClientEvents {
  [BCST_UPDATE_USERS_IN_ROOM]: ServerUpdateUsersInRoom;
  [BCST_CHANGE_READY_STATE]: ServerChangeReadyStateHander;
  [BCST_START_GAME]: ServerStartGameHander;
  [BCST_GAME_STATE_UPDATE]: ServerGameStateUpdate;
  [BCST_GAME_ALL_PLAYER_READY]: ServerGameAllPlayerReady;
  [BCST_GAME_DESTROYED]: ServerGameDestroyed;
}

export type ClientChangeReadyStateHander = (
  userID: number,
  isReady: boolean
) => void;

export type ClientEnterRoomHander = (userID: number, roomID: number) => void;

export type ClientLeaveRoomHander = (userID: number, roomID: number) => void;

export type ClientCreateGameHander = (userID: number, roomID: number) => void;

export type ClientDefaultHander = (data: {
  userId: number;
  roomId: number;
  matchesId: number;
}) => void;

export type ClientGameMurderHander = (data: {
  userId: number;
  roomId: number;
  matchesId: number;
  measure: string;
  clue: string;
}) => void;

export type ClientGamePointOutInformation = (data: {
  userId: number;
  roomId: number;
  matchesId: number;
  options: OptionInClient[];
}) => void;

export type ClientGameNextSpeaker = (data: {
  userId: number;
  roomId: number;
  matchesId: number;
  currentPlayerIndex: number;
}) => void;

export type ClientGameSolveCase = (data: {
  userId: number;
  roomId: number;
  playerId: number;
  matchesId: number;
  measure: string;
  clue: string;
}) => void;

export type ClientGameReplenishInformation = (data: {
  userId: number;
  roomId: number;
  matchesId: number;
  informationCards: Omit<InformationCardsOnMatches, 'matcheId'>[],
  options: OptionInClient[], 
}) => void;

export type ClientGameReady = (playerId: number, roomID: number, matchesId:number) => void;

export type ClientGameQuit = (playerId: number, roomID: number, matchesId:number) => void;

export type ClientConnectRoom = (roomID: number) => void;

export type ClientDisconnectRoom = (roomID: number) => void;

export interface ClientToServerEvents {
  [ACTION_CREATE_GAME]: ClientCreateGameHander;
  [ACTION_CHANGE_READY_STATE]: ClientChangeReadyStateHander;
  [ACTION_ENTER_ROOM]: ClientEnterRoomHander;
  [ACTION_LEAVE_ROOM]: ClientLeaveRoomHander;
  [ACTION_CONNECT_ROOM]: ClientConnectRoom;
  [ACTION_DISCONNECT_ROOM]: ClientDisconnectRoom;
  [ACTION_GAME_READY]: ClientGameReady;
  [ACTION_GAME_MURDER]: ClientGameMurderHander;
  [ACTION_GAME_PROVIDE_TESTIMONIALS]: ClientGamePointOutInformation;
  [ACTION_GAME_ADDITIONAL_TESTIMONIALS]: ClientGameReplenishInformation;
  [ACTION_GAME_SOLVE_CASE]: ClientGameSolveCase;
  [ACTION_GAME_ACCOMPLICE]: ClientDefaultHander;
  [ACTION_GAME_NEXT_SPEAKER]: ClientGameNextSpeaker;
  [ACTION_GAME_QUIT]: ClientGameQuit;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {}
