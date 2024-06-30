"use client";
import "./page.modules.css";
import "@/app/globals.css";
import Header from "@/components/Header";
import { selectUser } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSelector } from "react-redux";
const Top = () => {
  const router = useRouter();

  const userInfo = useSelector(selectUser);
  useEffect(() => {
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
