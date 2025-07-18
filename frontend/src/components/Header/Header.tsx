import config from "@/config/config.json";
import "@/styles/AllComponentsStyle.css";
import { useDispatch, useSelector } from "react-redux";
import { selectSidebar, AppDispatch, selectUser } from "@/lib/store";
import { setSidebarStatus } from "@/lib/sidebarReducer";
import Sidebar from "@/components/Sidebar/Sidebar";
import { useRouter } from "next/navigation";

const Header: React.FC = () => {
  const router = useRouter();
  const isOpenSidebar = useSelector(selectSidebar);
  const tmpUserInfo = useSelector(selectUser);
  const dispatch = useDispatch<AppDispatch>();

  const openSidebar = () => {
    dispatch(setSidebarStatus(true));
  };
  const closeSidebar = () => {
    dispatch(setSidebarStatus(false));
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
          <label
            className="header-label-inner"
            onClick={() => router.push("/")}
          >
            {config.title}
          </label>
        </div>
        <div
          className={`user-info-div ${
            tmpUserInfo.authority
              ? "admin-user-info-div"
              : "normal-user-info-div"
          }`}
        >
          {tmpUserInfo.name.slice(0, 1)}
        </div>
      </div>
      {isOpenSidebar && (
        <>
          <Sidebar />
          <div className="overlay" onClick={() => closeSidebar()}></div>
        </>
      )}
    </>
  );
};

export default Header;
