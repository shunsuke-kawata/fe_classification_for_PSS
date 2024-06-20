import "./page.modules.css";
import "@/app/globals.css";
import Header from "@/components/Header";
const Home = () => {
  return (
    <main>
      <Header />
      <div className="buttons-main">
          <input type="button" className="common-buttons top-buttons" value="ログイン"/>
          <input type="button" className="common-buttons top-buttons right-button" value="新規登録"/>
      </div>
    </main>
  );
};

export default Home;
