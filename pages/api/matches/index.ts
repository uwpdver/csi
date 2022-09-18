import type { NextApiRequest, NextApiResponse } from "next";
import { parseCookies } from "nookies";
import { getFirstQueryParmse } from "@/utils/getFirstQueryParmse";
import * as matchesServices from "./services";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, query } = req;
  const cookies = parseCookies({ req });
  const userId = parseInt(cookies.userId, 10);
  if (!cookies.userId) {
    res.status(403).end();
  }
  const roomId = parseInt(getFirstQueryParmse(query.roomId), 10);
  if (method === "POST") {
    try {
      const result = await matchesServices.createGame(userId, roomId);
      res.status(200).json(result);
    } catch (error) {
      throw new Error('错误')
    }
  } else {
    res.status(404).end();
  }
}
