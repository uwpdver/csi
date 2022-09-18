import type { NextApiRequest, NextApiResponse } from "next";
import { Server } from "socket.io";

import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "@/lib/socket";

import { socketController } from "./controller";

type Response = NextApiResponse & {
  socket: NextApiResponse["socket"] & {
    server: any;
  };
};

export default function handler(req: NextApiRequest, res: Response) {
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
      socketController(socket, io);
    });
  }
  res.end();
}
