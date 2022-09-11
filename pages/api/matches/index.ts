import type { NextApiRequest, NextApiResponse } from "next";
import { getFirstQueryParmse } from "@/utils/getFirstQueryParmse";
import { createGame } from "../socket";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method, query } = req;
  const roomId = parseInt(getFirstQueryParmse(query.roomId), 10);
  if (method === "POST") {
    const result = await createGame(roomId);
    res.status(200).json(result);
  } else {
    res.status(404).end();
  }
};

export default handler;
