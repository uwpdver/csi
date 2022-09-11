import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "./../../../lib/prisma";
import { pickInfoCards } from "@/utils/pickInfoCards";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const allCards = await prisma.informationCard.findMany({
    include: {
      list: {
        select: {
          content: true,
        },
      },
    },
  });
  const result = pickInfoCards(allCards);
  res.status(200).json(result);
};

export default handler;
