import React, { useState, useContext } from "react";
import type { GetServerSideProps } from "next";
import nookies from "nookies";
import { Room } from "@prisma/client";

import { useRouter } from "next/router";
import Link from "next/link";

import axios from "@/lib/axios";
import { prisma } from "@/lib/prisma";

import Header from "@/components/Header";
import { getLayout } from "@/components/Layout";
import HeroImg from "@/components/HeroImg";

import { NextPageWithLayout, UserInfoContext } from "pages/_app";
import SiteFooter from "@/components/SiteFooter";

interface Props {
  room: Room | null;
}

const Home: NextPageWithLayout<Props> = (props) => {
  const [inputedRoomID, setInputedRoomID] = useState("");
  const [roomName, setRoomName] = useState("");
  const { userInfo } = useContext(UserInfoContext);
  const router = useRouter();

  const toRoom = (roomID: string | number) => router.push(`/room/${roomID}`);

  const handleOnCreateRoom: React.FormEventHandler<HTMLFormElement> = async (
    e
  ) => {
    e.preventDefault();
    if (!roomName || !userInfo?.userId) {
      return null;
    }

    const {
      data: { id },
    } = await axios.post<{ id: number }>("room", {
      name: roomName,
      userId: Number(userInfo?.userId),
    });
    router.push(`/room/${id}`);
  };

  const handleOnJoinRoom: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!inputedRoomID) {
      return null;
    }
    toRoom(inputedRoomID);
    router.push(`/room/${inputedRoomID}`);
  };

  const handleOnInputChange: React.ChangeEventHandler<HTMLInputElement> = (
    e
  ) => {
    setInputedRoomID(e.target.value);
  };

  const handleChangeRoomName: React.ChangeEventHandler<HTMLInputElement> = (
    e
  ) => {
    setRoomName(e.target.value);
  };

  return (
    <>
      <Header className="mx-4" title="犯罪现场">
        {props.room ? (
          <Link href={`/room/${props.room.id}`}>
            <a className="link">返回房间</a>
          </Link>
        ) : (
          <div>{userInfo?.nickname}</div>
        )}
      </Header>

      <HeroImg className="mx-4" />

      {/* 底部命令栏 */}
      <div className="mt-auto mx-4">
        <form
          className="flex items-center shadow"
          onSubmit={handleOnCreateRoom}
        >
          <input
            className="flex-1"
            value={roomName}
            onChange={handleChangeRoomName}
            placeholder="房间名称"
          />
          <button type="submit">创建房间</button>
        </form>
        <form
          className="flex items-center mt-4 shadow"
          onSubmit={handleOnJoinRoom}
        >
          <input
            className="flex-1"
            value={inputedRoomID}
            onChange={handleOnInputChange}
            placeholder="房间号"
          />
          <button className="" type="submit">
            加入房间
          </button>
        </form>
      </div>
      <SiteFooter className="mx-4 mt-8" />
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const cookies = nookies.get(ctx);
  if (!cookies.userId) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
      props: {
        room: null,
      },
    };
  }
  const userId = parseInt(cookies.userId, 10);
  const userInRoom = await prisma.userInRoom.findUnique({
    where: {
      userId,
    },
    include: {
      room: true,
    },
  });
  return {
    props: {
      room: userInRoom?.room ?? null,
    },
  };
};

Home.getLayout = getLayout;

export default Home;
