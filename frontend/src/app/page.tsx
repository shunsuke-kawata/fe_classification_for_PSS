"use client";
import "./page.modules.css";
import "@/app/globals.css";
import Header from "@/components/Header";
import { useRouter } from "next/navigation";
const Home = () => {
  const router = useRouter();
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
