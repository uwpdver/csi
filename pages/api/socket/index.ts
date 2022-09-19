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
    console.log("Socket 正在运行");
  } else {
    console.log("Socket 正在初始化");
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
