import React, { useState, useEffect, useMemo, useContext } from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import nookies from "nookies";
import { User, Room, UserInRoom } from "@prisma/client";

import { getLayout } from "@/components/Layout";
import Avatar from "@/components/Avatar";
import Header from "@/components/Header";

import { getFirstQueryParmse } from "@/utils/getFirstQueryParmse";
import { useConnectToRoom } from "@/utils/useConnectToRoom";

import { NextPageWithLayout, UserInfoContext } from "pages/_app";
import * as roomServices from "pages/api/room/services";

import {
  ACTION_CREATE_GAME,
  ACTION_ENTER_ROOM,
  ACTION_LEAVE_ROOM,
  ACTION_CHANGE_READY_STATE,
  BCST_CHANGE_READY_STATE,
  BCST_GAME_DESTROYED,
  BCST_START_GAME,
  BCST_UPDATE_USERS_IN_ROOM,
} from "@/lib/socket/constants";
import {
  ServerChangeReadyStateHander,
  ServerStartGameHander,
  ServerUpdateUsersInRoom,
  useSocket
} from "@/lib/socket";

import { MIN_CAN_START_NUM_OF_USER } from '@/constants/index';

interface Props {
  data: Room & {
    users: (UserInRoom & {
      user: User;
    })[];
    host: User;
  };
}

const Room: NextPageWithLayout<Props> = ({ data }) => {
  const [users, setUsers] = useState(data.users);
  const [matchesId, setMatchesId] = useState<number | null>(data.matchesId);
  const { userInfo } = useContext(UserInfoContext);
  const router = useRouter();
  const { socket } = useSocket();
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
      socket?.emit(ACTION_ENTER_ROOM, userInfo.userId, roomId);
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
      setMatchesId(id);
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
    socket?.emit(ACTION_CHANGE_READY_STATE, userInfo.userId, !isReady);
  };

  const handleStartBtnClick = async () => {
    if (!userInfo?.userId) return null;
    socket?.emit(ACTION_CREATE_GAME, userInfo.userId, roomId);
  };

  const leaveRoom = () => {
    if (userInfo) {
      socket?.emit(ACTION_LEAVE_ROOM, userInfo.userId, roomId);
    }
    router.replace("/");
  };

  if (!userInfo?.userId) {
    return null;
  }

  return (
    <>
      <Head>
        <title>{`犯罪现场 房间：${roomId}`}</title>
      </Head>
      <Header className="px-4" title={`房间号：${roomId}`}>
        {matchesId ? null : (
          <Link href="/">
            <button className="link" onClick={leaveRoom} type="button">
              离开房间
            </button>
          </Link>
        )}
      </Header>
      {/* 房间信息栏 */}
      <div className="mt-4 mx-4 flex items-center">
        <div className="flex-1"> {data.title}</div>
      </div>
      {/* 主体内容区域 */}
      <div className="flex-1 mt-4 rounded-md mx-4 bg-gray-800">
        <ul className=" grid grid-cols-4 gap-4 p-4">
          {users.map((user) => (
            <li key={user.userId}>
              <div className="flex flex-col items-center">
                <Avatar nickname={user.user.name} className="mb-2" size="lg" />
                <div className="text-center truncate overflow-hidden w-full text-sm">
                  {userInfo.userId === user.userId ? "自己" : user.user.name}
                </div>
                <div className="text-xs">
                  {user.isReady ? "已准备" : "未准备"}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* 底部命令栏 */}
      <div className="mt-4 mx-4 mb-4">
        {matchesId ? (
          <Link href={`/matches/${roomId}/${matchesId}`}>
            <button className="w-full">继续进行中的对局</button>
          </Link>
        ) : (
          <>
            {data.hostId === userInfo?.userId && (
              <button
                className="w-full "
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
  const room = await roomServices.getDetailById(roomId);
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
