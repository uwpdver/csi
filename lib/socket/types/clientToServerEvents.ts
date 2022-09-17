import { InformationCardsOnMatches } from "@prisma/client";
import { OptionInClient } from "@/types/client";
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
  ACTION_GAME_QUIT,
  ACTION_CONNECT_ROOM,
  ACTION_DISCONNECT_ROOM,
} from "@/constants/index";

// 客户端发送给服务端的事件
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
  informationCards: Omit<InformationCardsOnMatches, "matcheId">[];
  options: OptionInClient[];
}) => void;

export type ClientGameReady = (
  playerId: number,
  roomID: number,
  matchesId: number
) => void;

export type ClientGameQuit = (
  playerId: number,
  roomID: number,
  matchesId: number
) => void;

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
