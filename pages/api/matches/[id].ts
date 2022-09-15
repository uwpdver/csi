import type { NextApiRequest, NextApiResponse } from "next";
import { NotFoundError } from "@prisma/client/runtime";
import { prisma } from "@/lib/prisma";
import { getFirstQueryParmse } from "@/utils/getFirstQueryParmse";

export const getMatchesById = async (id: number) => {
  const result = await prisma.matches.findUniqueOrThrow({
    where: {
      id,
    },
    include: {
      informationCards: {
        orderBy: {
          order: "asc",
        },
        include: {
          informationCard: {
            include: {
              list: true,
            },
          },
        },
      },
      players: {
        include: {
          user: true,
          measureCards: {
            include: {
              measureCard: true,
            },
          },
          clueCards: {
            include: {
              clueCard: true,
            },
          },
        },
      },
      options: {
        orderBy: {
          order: "asc",
        },
        include: {
          option: true,
        },
      },
    },
  });
  return result;
};

export const deleteMatchesById = async (id: number) => {
  await prisma.measureCardsOnPlayers.deleteMany({
    where: {
      player: {
        matchesId: id,
      },
    },
  });
  await prisma.clueCardsOnPlayers.deleteMany({
    where: {
      player: {
        matchesId: id,
      },
    },
  });

  const { roomId } = await prisma.matches.update({
    where: {
      id,
    },
    data: {
      players: {
        deleteMany: {},
      },
      informationCards: {
        deleteMany: {},
      },
      options: {
        deleteMany: {},
      },
    },
  });
  await prisma.room.update({
    where: {
      id: roomId,
    },
    data: {
      matches: {
        delete: true,
      },
      matchesId: null
    },
  });
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method, query } = req;
  const matchesId = parseInt(getFirstQueryParmse(query.id), 10);
  let result = null;
  switch (method) {
    case "GET":
      try {
        result = await getMatchesById(matchesId);
        res.status(200).json(result);
      } catch (error) {
        console.error("错误", error);
        if (error instanceof NotFoundError) {
          res.status(404).end("not find");
        }
      }
      break;
    case "DELETE":
      result = await deleteMatchesById(matchesId);
      res.status(200).end("delete ok");
      break;
    default:
      break;
  }
};

export default handler;
