import type { NextApiRequest, NextApiResponse } from "next";
import { setCookie } from "nookies";
import { prisma } from "@/lib/prisma";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method, body } = req;
  if (method === "POST") {
    const { name, email } = body;
    try {
      let result = await prisma.user.create({
        select: {
          id: true,
          name: true,
        },
        data: {
          email: email,
          name: name,
        },
      });

      setCookie({ res }, "userId", String(result.id), {
        maxAge: 24 * 60 * 60,
        path: '/'
      });

      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res.status(400).end();
    }
  } else {
    res.status(404).end();
  }
};

export default handler;
