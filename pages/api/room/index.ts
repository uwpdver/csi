import type { NextApiRequest, NextApiResponse } from "next";
import * as roomServices from "./services";

type Response = NextApiResponse & {
  socket: NextApiResponse["socket"] & {
    server: any;
  };
};

const roomHandler = async (req: NextApiRequest, res: Response) => {
  const {
    method,
    body: { userId, name },
  } = req;
  if (method === "POST") {
    try {
      const room = await roomServices.createRoom(userId, name);
      res.status(200).json(room);
    } catch (error) {
      throw new Error("错误");
    }
  } else {
    res.status(404).end();
  }
};

export default roomHandler;
