"use client";
import "@/styles/AllComponentsStyle.css";
import { setSidebarStatus } from "@/lib/sidebarReducer";
import { AppDispatch, selectSidebar } from "@/lib/store";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { logout } from "@/utils/utils";

const Sidebar: React.FC = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const closeSidebar = () => {
    dispatch(setSidebarStatus(false));
  };

  const handleLogout = () => {
    logout();
    router.push("/");
    closeSidebar();
  };

  return (
    <>
      <div className="sidebar-main">
        <div className="close-sidebar-button" onClick={() => closeSidebar()}>
          ✖️
          {/* <img
            className="close-sidebar-button-icon"
            src="/assets/batsu-icon.svg"
            alt="バツボタン"
          /> */}
        </div>
        <div className="sidebar-menu">
          <div className="sidebar-menu-value">トップ</div>
          <div className="sidebar-menu-value">プロジェクト一覧</div>
          <div className="sidebar-menu-value">新規登録</div>
          <div className="sidebar-menu-value">ログイン</div>
          <div className="sidebar-menu-value" onClick={() => handleLogout()}>
            ログアウト
          </div>
        </div>
      </div>
    </>
  );
};
export default Sidebar;
