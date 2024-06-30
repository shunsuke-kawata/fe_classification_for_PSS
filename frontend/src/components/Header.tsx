"use client";
import config from "@/config/config.json";
import "@/styles/AllComponentsStyle.css";
import { useDispatch, useSelector } from "react-redux";
import { selectSidebar, AppDispatch } from "@/lib/store";
import { setSidebarStatus } from "@/lib/sidebarReducer";
import Sidebar from "./Sidebar";

const Header: React.FC = () => {
  const isOpenSidebar = useSelector(selectSidebar);
  const dispatch = useDispatch<AppDispatch>();

  const openSidebar = () => {
    dispatch(setSidebarStatus(true));
  };

  return (
    <>
      <div className="header-main">
        <div className="hamburger-menu" onClick={() => openSidebar()}>
          <img
            className="hamburger-menu-icon"
            src="/assets/hamburger-menu-icon.svg"
            alt="ハンバーガーメニュー"
          />
        </div>
        <div className="header-label-outer">
          <label className="header-label-inner">{config.title}</label>
        </div>
      </div>
      {isOpenSidebar && <Sidebar />}
    </>
  );
};

export default Header;
