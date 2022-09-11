import type { NextApiRequest, NextApiResponse } from "next";
import { createGame } from "../socket";
import { getFirstQueryParmse } from "@/utils/getFirstQueryParmse";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const {
    query,
  } = req;
  const roomId = getFirstQueryParmse(query.roomId);
  const game = await createGame(parseInt(roomId ?? "", 10));
  res.status(200).json(game);
};

export default handler;
