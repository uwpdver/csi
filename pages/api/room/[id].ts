import type { NextApiRequest, NextApiResponse } from "next";
import { getFirstQueryParmse } from "@/utils/getFirstQueryParmse";
import * as roomServices from "./services";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { query } = req;
  const roomId = parseInt(getFirstQueryParmse(query.id), 10);
  try {
    const room = await roomServices.getDetailById(roomId);
    res.status(200).json(room);
  } catch (error) {
    throw new Error("错误");
  }
}
