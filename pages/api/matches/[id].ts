import type { NextApiRequest, NextApiResponse } from "next";
import { getFirstQueryParmse } from "@/utils/getFirstQueryParmse";
import * as matchesServices from "./services";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, query } = req;
  const matchesId = parseInt(getFirstQueryParmse(query.id), 10);
  let result = null;
  switch (method) {
    case "GET":
      try {
        const matches = await matchesServices.getDetailById(matchesId);
        res.status(200).json(matches);
      } catch (error) {
        console.error(error);
      }
      break;
    case "DELETE":
      try {
        await matchesServices.deleteMatchesById(matchesId);
        res.status(200).end("delete ok");
      } catch (error) {
        console.error(error);
      }
      break;
    default:
      break;
  }
}
