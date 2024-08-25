"use client";
import "./page.modules.css";
import "@/app/globals.css";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { AppDispatch, selectUser } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setSidebarStatus } from "@/lib/sidebarReducer";
import { setLoginedUser } from "@/lib/userReducer";
import { getLoginedUser } from "@/utils/utils";
const Top = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [isLoading, setIsLoading] = useState(true);
  const loginedUser = useSelector(selectUser);

  useEffect(() => {
    const initializeUser = async () => {
      const user = getLoginedUser();
      dispatch(setLoginedUser(user));
      dispatch(setSidebarStatus(false));
      setIsLoading(false);
      console.log(user);
      console.log(process.env.ACCESS_KEY_ID);
    };

    initializeUser();
  }, [dispatch]);

  if (isLoading) {
    return (
      <>
        <Header />
      </>
    );
  }

  return (
    <main>
      <Header />
      <div className="buttons-main">
        <input
          type="button"
          className="common-buttons top-buttons"
          value="ログイン"
          onClick={() => router.push("/login")}
        />
        <input
          type="button"
          className="common-buttons top-buttons right-button"
          value="新規登録"
          onClick={() => router.push("/signup")}
        />
      </div>
    </main>
  );
};

export default Top;
