"use client";
import "./page.modules.css";
import "@/app/globals.css";
import Header from "@/components/Header";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch } from "@/lib/store";
import { useEffect } from "react";
import { LoginUserState } from "@/lib/userReducer";

const Home = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const email = useSelector((state: LoginUserState) => state);
  console.log(email);

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

export default Home;
