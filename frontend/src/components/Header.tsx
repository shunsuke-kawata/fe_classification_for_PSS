import config from "@/config/config.json";
import "@/styles/AllComponentsStyle.css";

const Header = () => {
  return (
    <>
      <div className="header-main">
        <div className="header-label-outer">
          <label className="header-label-inner">{config.title}</label>
        </div>
      </div>
    </>
  );
};

export default Header;
