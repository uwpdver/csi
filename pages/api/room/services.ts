import { prisma } from "@/lib/prisma";

// 用户进入房间
export async function enterRoom(userId: number, roomId: number) {
  const room = await prisma.room.findUnique({
    where: {
      id: roomId,
    },
    include: {
      users: true,
    },
  });

  if (!room) {
    throw new Error("room doest not exsit");
  }

  if (room.users.find((user) => userId === user.userId)) {
    throw new Error("you are aready in the room");
  }

  const result = await prisma.room.update({
    where: {
      id: roomId,
    },
    data: {
      users: {
        create: [
          {
            userId,
            isReady: false,
          },
        ],
      },
    },
    include: {
      users: {
        include: {
          user: true,
        },
      },
    },
  });
  return result;
}

// 用户离开房间
export async function leaveRoom(userId: number, roomId: number) {
  const roomInclude = {
    users: {
      include: {
        user: true,
      },
    },
  };

  try {
    const room = await prisma.room.update({
      where: {
        id: roomId,
      },
      data: {
        users: {
          deleteMany: {
            userId,
          },
        },
      },
      include: roomInclude,
    });
    if (room.users.length === 0) {
      return await prisma.room.delete({
        where: {
          id: roomId,
        },
        include: roomInclude,
      });
    } else if (room.hostId === userId) {
      return await prisma.room.update({
        where: {
          id: roomId,
        },
        data: {
          host: {
            connect: {
              id: room.users[0].userId,
            },
          },
        },
        include: roomInclude,
      });
    } else {
      return room;
    }
  } catch (error) {
    console.error(error);
  }
}

export async function createRoom(userId: number, title: string) {
  const room = await prisma.room.create({
    data: {
      hostId: userId,
      title,
    },
  });
  return room;
}

export async function getDetailById(id: number) {
  const room = await prisma.room.findUnique({
    where: {
      id,
    },
    include: {
      users: {
        include: {
          user: true,
        },
      },
      host: true,
    },
  });
  return room;
}

export async function getUserRoom(userId: number) {
  const userInRoom = await prisma.userInRoom.findUnique({
    where: {
      userId,
    },
    include: {
      room: true,
    },
  });
  return userInRoom?.room;
}

export async function changeUserReadyState(userId: number, isReady: boolean) {
  const result = await prisma.userInRoom.update({
    where: {
      userId,
    },
    data: {
      isReady,
    },
  });
  return result;
}
