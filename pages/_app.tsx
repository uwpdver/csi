import React, { useState, useEffect, ReactElement, ReactNode } from "react";
import type { NextPage } from "next";
import { io, Socket } from "socket.io-client";
import type { AppProps } from "next/app";
import { ServerToClientEvents, ClientToServerEvents } from "@/types/socket";
import { LOCAL_STORAGE_KEYS } from "@/constants/index";
import "../styles/globals.css";

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

export let socket: Socket<ServerToClientEvents, ClientToServerEvents>;

(async () => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    await fetch("/api/socket");
    socket = io();
    socket.on("connect", () => {
      console.log("connect");
    });
    socket.on("disconnect", () => {
      console.log("断开连接了");
    });
  } catch (error) {
    console.log(error);
  }
})();

type UserInfo = {
  userId: number;
  nickname: string;
} | null;

export const UserInfoContext = React.createContext<{
  userInfo: UserInfo;
  setUserInfo: React.Dispatch<React.SetStateAction<UserInfo>>;
}>({
  userInfo: null,
  setUserInfo: () => {},
});

const getUserInfoFromLocal = () => {
  let result = null;
  if (typeof window !== "undefined") {
    const storedData = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_INFO);
    if (storedData) {
      result = JSON.parse(storedData);
    }
  }
  return result;
};

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const [userInfo, setUserInfo] = useState<UserInfo>(null);

  useEffect(() => {
    const localUserInfo = getUserInfoFromLocal();
    setUserInfo(localUserInfo);
  }, []);

  const getLayout = Component.getLayout ?? ((page) => page);

  return getLayout(
    <UserInfoContext.Provider value={{ userInfo, setUserInfo }}>
      <Component {...pageProps} />
    </UserInfoContext.Provider>
  );
}

export default MyApp;
