import { Socket } from "socket.io-client";
import { ServerToClientEvents } from "./serverToClientEvents";
import { ClientToServerEvents } from "./clientToServerEvents";

export * from "./clientToServerEvents";
export * from "./serverToClientEvents";

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {}

export type ISocket = Socket<ServerToClientEvents, ClientToServerEvents> | null;

export interface ConnectState {
  isConnecting: boolean;
  isConnected: boolean;
  socket: ISocket;
}
