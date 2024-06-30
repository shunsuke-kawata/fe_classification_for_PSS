"use client";
import "./page.modules.css";
import "@/app/globals.css";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { AppDispatch, selectUser } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setSidebarStatus } from "@/lib/sidebarReducer";
const Top = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const userInfo = useSelector(selectUser);
  useEffect(() => {
    dispatch(setSidebarStatus(false));
    console.log(userInfo);
  }, []);

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
