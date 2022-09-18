import { prisma } from "@/lib/prisma";

// 创建新游戏房间
export async function createRoom(userId: number, title: string) {
  const room = await prisma.room.create({
    data: {
      hostId: userId,
      title,
    },
  });
  return room;
}

// 用户进入房间
export async function enterRoom(userId: number, roomId: number) {
  const room = await getDetailById(roomId);
  if (!room) {
    throw new Error("房间不存在");
  }
  if (room.users.find((user) => userId === user.userId)) {
    throw new Error("该用户已在房间中");
  }
  return addUserToRoom(userId, roomId);
}

// 用户离开房间
export async function leaveRoom(userId: number, roomId: number) {
  try {
    const room = await removeUserFromRoom(userId, roomId);
    if (room.users.length === 0) {
      return deleteRoom(roomId);
    } else if (room.hostId === userId) {
      return changeRoomHost(room.users[0].userId, roomId);
    } else {
      return room;
    }
  } catch (error) {
    console.error(error);
  }
}

// 将一名用户从房间中移除
export async function addUserToRoom(userId: number, roomId: number) {
  return await prisma.room.update({
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
}

// 将一名用户从房间中移除
export async function removeUserFromRoom(userId: number, roomId: number) {
  return await prisma.room.update({
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
    include: {
      users: {
        include: {
          user: true,
        },
      },
    },
  });
}

// 删除游戏房间
export async function deleteRoom(roomId: number) {
  return await prisma.room.delete({
    where: {
      id: roomId,
    },
  });
}

// 改变房间的房主
export async function changeRoomHost(userId: number, roomId: number) {
  return await prisma.room.update({
    where: {
      id: roomId,
    },
    data: {
      host: {
        connect: {
          id: userId,
        },
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
}

// 获取房间详情
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

// 获取用户所在的房间
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

// 修改用户准备状态
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
