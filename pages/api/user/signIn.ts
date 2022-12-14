import type { NextApiRequest, NextApiResponse } from "next";
import { setCookie } from "nookies";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, body } = req;
  if (method === "POST") {
    const { email } = body;
    let result;
    try {
      result = await prisma.user.findUniqueOrThrow({
        select: {
          id: true,
          name: true,
        },
        where: {
          email: email,
        },
      });
      setCookie({ res }, "userId", String(result.id), {
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
      });
      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res.status(404).end("");
    }
  } else {
    res.status(404).end();
  }
}
