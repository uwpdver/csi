import shuffle from "lodash.shuffle";
import type { NextApiRequest, NextApiResponse } from "next";
import { InformationCardStatus, Phases } from "@/types/index";
import { getFirstQueryParmse } from "@/utils/getFirstQueryParmse";
import { prisma } from "./../../../lib/prisma";

const nextSpeaker = async (matchesId: number) => {
  const matches = await prisma.matches.findUniqueOrThrow({
    where: { id: matchesId },
    include: {
      players: true,
    },
  });
  const { currentPlayerIndex, players, rounds } = matches;
  const isLastSpeaker = currentPlayerIndex === players.length - 2;
  const data: {
    phases?: Phases;
    rounds?: number;
    currentPlayerIndex?: number;
    informationCards?: any;
  } = {};
  if (!isLastSpeaker) {
    data.currentPlayerIndex = currentPlayerIndex + 1;
  } else {
    // 一轮推理结束
    const MAX_ROUNDS = 3;
    data.currentPlayerIndex = 0;
    data.rounds = Math.min(rounds + 1, MAX_ROUNDS);

    if (rounds === MAX_ROUNDS) {
      data.phases = Phases.MurdererWin;
    } else if (players.length > 5) {
      // 人数超过五个有帮凶
      data.phases = Phases.Accomplice;
    } else {
      const infoCards = await prisma.informationCardsOnMatches.findMany({
        where: {
          matcheId: matchesId,
        },
      });
      const restInfoCards = await prisma.informationCard.findMany({
        where: {
          AND: [
            {
              categoryName: {
                notIn: ["死亡原因", "案发地点"],
              },
            },
            {
              id: {
                notIn: infoCards.map((card) => card.informationCardId),
              },
            },
          ],
        },
      });

      if (restInfoCards.length > 0) {
        const newCard = shuffle(restInfoCards)[0];
        data.informationCards = {
          create: [
            {
              status: InformationCardStatus.Pending,
              order: infoCards.length + 1,
              informationCard: {
                connect: {
                  id: newCard.id,
                },
              },
            },
          ],
        };
      }
      data.phases = Phases.AdditionalTestimonials;
    }
  }
  return await prisma.matches.update({
    where: { id: matchesId },
    data: data,
  });
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { query } = req;
  const matchesId = parseInt(getFirstQueryParmse(query.matchesId), 10);
  const result = await nextSpeaker(matchesId);
  res.status(200).json(result);
};

export default handler;
