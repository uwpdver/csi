import { prisma } from "../../../lib/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { getFirstQueryParmse } from "@/utils/getFirstQueryParmse";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { query } = req;
  const roomId = parseInt(getFirstQueryParmse(query.id), 10);
  const room = await prisma.room.findUnique({
    where: {
      id: roomId,
    },
    include: {
      users: {
        include: {
          user: true,
        },
      },
    },
  });
  res.status(200).json(room);
};

export default handler;
