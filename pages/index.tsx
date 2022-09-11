import React, { useState, useContext } from "react";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import axios from "./../lib/axios";
import { NextPageWithLayout, UserInfoContext } from "./_app";
import { prisma } from "../lib/prisma";
import nookies from "nookies";
import { Room } from "@prisma/client";
import Link from "next/link";
import Header from "@/components/Header";
import { getLayout } from "@/components/Layout";

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
      <Header>犯罪现场</Header>
      <div className="flex items-center mt-2">
        <div className="flex-1">{userInfo?.nickname}</div>
        <div className="flex-1 text-center"></div>
        <div className="flex-1  text-right">
          {props.room ? (
            <Link href={`/room/${props.room.id}`}>
              <a>返回房间</a>
            </Link>
          ) : null}
        </div>
      </div>
      <div className="mt-auto mb-32">
        <form className="flex items-center" onSubmit={handleOnCreateRoom}>
          <input
            className="flex-1"
            value={roomName}
            onChange={handleChangeRoomName}
            placeholder="房间名称"
          />
          <button type="submit">创建房间</button>
        </form>
        <form className="flex items-center mt-4" onSubmit={handleOnJoinRoom}>
          <input
            className="flex-1"
            value={inputedRoomID}
            onChange={handleOnInputChange}
            placeholder="房间号"
          />
          <button type="submit">加入房间</button>
        </form>
      </div>
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
