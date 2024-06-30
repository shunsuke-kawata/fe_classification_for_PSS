"use client";
import "@/styles/AllComponentsStyle.css";
import { setSidebarStatus } from "@/lib/sidebarReducer";
import { AppDispatch, selectSidebar } from "@/lib/store";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { getLoginedUser, logout } from "@/utils/utils";
import { setLoginedUser } from "@/lib/userReducer";

const Sidebar: React.FC = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const closeSidebar = () => {
    dispatch(setSidebarStatus(false));
  };

  const handleLogout = () => {
    logout();
    const tmpUser = getLoginedUser();
    dispatch(setLoginedUser(tmpUser));
    transitFromSidebar("/");
  };

  const transitFromSidebar = (path: string) => {
    router.push(path);
    closeSidebar();
  };

  return (
    <>
      <div className="sidebar-main">
        <div className="close-sidebar-button" onClick={() => closeSidebar()}>
          <img
            className="close-sidebar-button-icon"
            src="/assets/batsu-icon.svg"
            alt="バツボタン"
          />
        </div>
        <div className="sidebar-menu">
          <div
            className="sidebar-menu-value"
            onClick={() => transitFromSidebar("/")}
          >
            トップ
          </div>
          <div
            className="sidebar-menu-value"
            onClick={() => transitFromSidebar("/project")}
          >
            プロジェクト一覧
          </div>
          <div
            className="sidebar-menu-value"
            onClick={() => transitFromSidebar("/signup")}
          >
            新規登録
          </div>
          <div
            className="sidebar-menu-value"
            onClick={() => transitFromSidebar("/login")}
          >
            ログイン
          </div>
          <div className="sidebar-menu-value" onClick={() => handleLogout()}>
            ログアウト
          </div>
        </div>
      </div>
    </>
  );
};
export default Sidebar;
