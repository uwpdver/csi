import React, { useState, useEffect, useMemo, useContext } from "react";
import type { GetServerSideProps } from "next";
import nookies from "nookies";
import {
  ACTION_CREATE_GAME,
  ACTION_ENTER_ROOM,
  ACTION_LEAVE_ROOM,
  BCST_CHANGE_READY_STATE,
  BCST_GAME_DESTROYED,
  BCST_START_GAME,
  BCST_UPDATE_USERS_IN_ROOM,
} from "@/constants/index";
import { NextPageWithLayout, socket, UserInfoContext } from "../_app";
import { useRouter } from "next/router";
import { getFirstQueryParmse } from "@/utils/getFirstQueryParmse";
import { prisma } from "../../lib/prisma";
import { User, Room, UserInRoom } from "@prisma/client";
import { ACTION_CHANGE_READY_STATE } from "@/constants/index";
import {
  ServerChangeReadyStateHander,
  ServerStartGameHander,
  ServerUpdateUsersInRoom,
} from "@/types/socket";
import Link from "next/link";
import { useConnectToRoom } from "@/utils/useConnectToRoom";
import { getLayout } from "@/components/Layout";

interface Props {
  data: Room & {
    users: (UserInRoom & {
      user: User;
    })[];
    host: User;
  };
}

const MIN_CAN_START_NUM_OF_USER = 2;

const Room: NextPageWithLayout<Props> = ({ data }) => {
  const [users, setUsers] = useState(data.users);
  const [matchesId, setMatchesId] = useState<number | null>(data.matchesId);
  const { userInfo } = useContext(UserInfoContext);
  const router = useRouter();
  const { query } = router;
  const roomId = parseInt(getFirstQueryParmse(query.id), 10);
  const { isReady } = users.find(
    (user) => user.userId === userInfo?.userId
  ) ?? { isReady: false };

  useConnectToRoom(roomId);

  useEffect(() => {
    if (
      userInfo &&
      roomId &&
      !data.users.find((user) => user.userId === userInfo.userId)
    ) {
      socket.emit(ACTION_ENTER_ROOM, userInfo.userId, roomId);
    }
  }, [userInfo, roomId, data.users]);

  useEffect(() => {
    const updateUsers: ServerUpdateUsersInRoom = ({ users }) => {
      setUsers(users);
    };

    const updateReadyState: ServerChangeReadyStateHander = ({
      userId,
      isReady,
    }) => {
      const index = users.findIndex((user) => user.userId === userId);
      if (index > -1) {
        setUsers([
          ...users.slice(0, index),
          {
            ...users[index],
            isReady,
          },
          ...users.slice(index + 1),
        ]);
      }
    };

    const toMatches: ServerStartGameHander = ({ id }) => {
      setMatchesId(id)
      router.push(`/matches/${roomId}/${id}`);
    };

    const handleGameDestroyed = () => setMatchesId(null);

    socket?.on(BCST_UPDATE_USERS_IN_ROOM, updateUsers);
    socket?.on(BCST_CHANGE_READY_STATE, updateReadyState);
    socket?.on(BCST_START_GAME, toMatches);
    socket?.on(BCST_GAME_DESTROYED, handleGameDestroyed);
    return () => {
      socket?.off(BCST_UPDATE_USERS_IN_ROOM, updateUsers);
      socket?.off(BCST_CHANGE_READY_STATE, updateReadyState);
      socket?.off(BCST_START_GAME, toMatches);
      socket?.off(BCST_GAME_DESTROYED, handleGameDestroyed);
    };
  }, [roomId, users, router]);

  const canStart = useMemo(
    () =>
      users.every(({ isReady }) => isReady) &&
      users.length >= MIN_CAN_START_NUM_OF_USER,
    [users]
  );

  const handleReadyBtnClick = () => {
    if (!userInfo?.userId) return null;
    socket.emit(ACTION_CHANGE_READY_STATE, userInfo.userId, !isReady);
  };

  const handleStartBtnClick = async () => {
    if (!userInfo?.userId) return null;
    socket.emit(ACTION_CREATE_GAME, userInfo.userId, roomId);
  };

  const leaveRoom = () => {
    if (userInfo) {
      socket.emit(ACTION_LEAVE_ROOM, userInfo.userId, roomId);
    }
    router.replace("/");
  };

  if (!userInfo?.userId) {
    return null;
  }

  return (
    <>
      <header className="text-3xl pt-4">房间号：{roomId}</header>
      <div className="mt-2 flex items-center">
        <div className="flex-1"> {data.title}</div>
        {matchesId ? null : (
          <Link href="/">
            <button className="link" onClick={leaveRoom} type="button">
              离开房间
            </button>
          </Link>
        )}
      </div>
      <ul className="grid grid-cols-3 gap-4 mt-4">
        {users.map((user) => (
          <li key={user.userId}>
            <div className="flex flex-col items-center">
              <div className="h-20 w-20 flex items-center justify-center rounded-full bg-gray-300 text-lg">
                <span>{user.user.name?.slice(0, 1)}</span>
              </div>
              <div className="text-center truncate overflow-hidden w-full">
                {userInfo.userId === user.userId ? "自己" : user.user.name}
              </div>
              <div className="text-sm">
                {user.isReady ? "已准备" : "未准备"}
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-auto">
        {matchesId ? (
          <Link href={`/matches/${roomId}/${matchesId}`}>
            <button className="w-full">继续进行中的对局</button>
          </Link>
        ) : (
          <>
            {data.hostId === userInfo?.userId && (
              <button
                className="w-full disabled:bg-gray-200 disabled:text-gray-400 disabled:border-gray-200"
                disabled={!canStart}
                onClick={handleStartBtnClick}
              >
                开始
              </button>
            )}
            <button className="w-full mt-4" onClick={handleReadyBtnClick}>
              {isReady ? "取消准备" : "准备"}
            </button>
          </>
        )}
      </div>
    </>
  );
};

Room.getLayout = getLayout;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { query } = ctx;
  const cookies = nookies.get(ctx);
  if (!cookies.userId) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }
  const roomId = parseInt(getFirstQueryParmse(query.id), 10);
  const room = await prisma.room.findUnique({
    where: {
      id: roomId,
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

  if (!room) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {
      data: room,
    },
  };
};

export default Room;
