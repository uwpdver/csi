import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "./../../../lib/prisma";

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
      const result = await prisma.room.create({
        data: {
          hostId: userId,
          title: name,
        },
      });
      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res.status(400).end("");
    }
  } else {
    res.status(404).end();
  }
};

export default roomHandler;
