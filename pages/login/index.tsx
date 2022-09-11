import React, { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "../../lib/axios";
import { LOCAL_STORAGE_KEYS } from "@/constants/index";
import { NextPageWithLayout, UserInfoContext } from "../_app";
import Header from "@/components/Header";
import { getLayout } from "@/components/Layout";

const userId =
  typeof window !== "undefined"
    ? localStorage.getItem(LOCAL_STORAGE_KEYS.USER_ID)
    : "";

const Login: NextPageWithLayout<{}> = () => {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const { userInfo, setUserInfo } = useContext(UserInfoContext);
  const router = useRouter();

  useEffect(() => {
    if (userInfo) {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            LOCAL_STORAGE_KEYS.USER_INFO,
            JSON.stringify(userInfo)
          );
        } catch (error) {
          console.error(error);
        }
      }
      router.push("/");
    }
  }, [userInfo, router]);

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
        id: userId,
        name: nickname,
        email: email,
      });
      setUserInfo({ userId: id, nickname: name });
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
      id: userId,
      name: nickname,
      email: email,
    });
    setUserInfo({ userId: id, nickname: name });
  };

  return (
    <>
      <Header>犯罪现场</Header>
      <div className="mt-auto mb-32">
        {isSignUp ? (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="flex items-center">
              <input
                className="flex-1"
                name="nickname"
                placeholder="希望在游戏中如何的称呼您"
                value={nickname}
                onChange={handleChangeNickname}
              />
            </div>
            <button type="submit" className="block w-full">
              完成
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="flex items-center">
              <input
                className="flex-1"
                type="email"
                required
                placeholder="输入邮箱账号"
                value={email}
                onChange={handleChangeEmail}
              />
            </div>
            <button type="submit" className="block w-full">
              确定
            </button>
          </form>
        )}
      </div>
    </>
  );
};

Login.getLayout = getLayout;

export default Login;
