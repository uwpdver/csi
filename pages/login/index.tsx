import React, { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { parseCookies } from "nookies";
import axios from "@/lib/axios";

import Header from "@/components/Header";
import HeroImg from "@/components/HeroImg";
import { getLayout } from "@/components/Layout";
import SiteFooter from "@/components/SiteFooter";

import { LOCAL_STORAGE_KEYS } from "@/constants/index";

import { NextPageWithLayout, UserInfo, UserInfoContext } from "pages/_app";

const saveUserInfoToStorage = (data: UserInfo) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER_INFO, JSON.stringify(data));
    } catch (error) {
      console.error(error);
    }
  }
};

const Login: NextPageWithLayout<{}> = () => {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const { userInfo, setUserInfo } = useContext(UserInfoContext);
  const router = useRouter();

  useEffect(() => {
    const cookies = parseCookies();
    if (cookies.userId) {
      router.replace("/");
    }
  }, [router]);

  const saveUserInfo = (id:number, name:string) => {
    setUserInfo({ userId: id, nickname: name });
    saveUserInfoToStorage({ userId: id, nickname: name })
  }

  const handleChangeNickname: React.ChangeEventHandler<HTMLInputElement> = (
    e
  ) => {
    setNickname(e.target.value);
  };

  const handleChangeEmail: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setEmail(e.target.value);
  };

  const handleSignIn: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    try {
      const {
        data: { id, name },
      } = await axios.post("/user/signIn", {
        name: nickname,
        email: email,
      });
      saveUserInfo(id, name);
      router.replace("/");
    } catch (error) {
      console.log(error);
      setIsSignUp(true);
    }
  };

  const handleSignUp: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    const {
      data: { id, name },
    } = await axios.post("/user/signUp", {
      name: nickname,
      email: email,
    });
    saveUserInfo(id, name);
    router.replace("/");
  };

  return (
    <>
      <Header className="mx-4" title="????????????" />
      <HeroImg className="mx-4" />
      <div className="mt-auto mx-4">
        {isSignUp ? (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="flex items-center">
              <input
                className="flex-1"
                name="nickname"
                placeholder="????????????????????????????????????"
                value={nickname}
                onChange={handleChangeNickname}
              />
            </div>
            <button type="submit" className="block w-full">
              ??????
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="text-xs text-gray-400">
              *
              ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????
            </div>
            <div className="flex items-center">
              <input
                className="flex-1"
                type="email"
                required
                placeholder="??????????????????"
                value={email}
                onChange={handleChangeEmail}
              />
            </div>
            <button type="submit" className="block w-full">
              ??????
            </button>
          </form>
        )}
      </div>
      <SiteFooter className="mx-4 mt-8 mb-4" />
    </>
  );
};

Login.getLayout = getLayout;

export default Login;
