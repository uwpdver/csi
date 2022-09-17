import React, { useState, useEffect, ReactElement, ReactNode } from "react";
import type { NextPage } from "next";
import type { AppProps } from "next/app";
import Modal from "react-modal";
import { LOCAL_STORAGE_KEYS } from "@/constants/index";
import { SocketProvider } from "@/lib/socket";
import "../styles/globals.css";
import "intro.js/introjs.css";

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

Modal.setAppElement("#__next");

export type UserInfo = {
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
      <SocketProvider>
        <Component {...pageProps} />
      </SocketProvider>
    </UserInfoContext.Provider>
  );
}

export default MyApp;
