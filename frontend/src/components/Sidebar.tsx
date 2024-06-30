"use client";
import "@/styles/AllComponentsStyle.css";
import { setSidebarStatus } from "@/lib/sidebarReducer";
import { AppDispatch, selectSidebar } from "@/lib/store";
import { useDispatch, useSelector } from "react-redux";

const Sidebar: React.FC = () => {
  const isOpenSidebar = useSelector(selectSidebar);
  const dispatch = useDispatch<AppDispatch>();
  const closeSidebar = () => {
    dispatch(setSidebarStatus(false));
  };

  return (
    <>
      <div className="sidebar-main">
        <p>サイドバー</p>
        <div className="close-sidebar-button" onClick={() => closeSidebar()}>
          <img
            className="close-sidebar-button-icon"
            src="/assets/batsu-icon.svg"
            alt="バツボタン"
          />
        </div>
        <div className="sidebar-menu"></div>
      </div>
    </>
  );
};
export default Sidebar;
