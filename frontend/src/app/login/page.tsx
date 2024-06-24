import "./page.modules.css";
import Header from "@/components/Header";
import UserForm from "@/components/UserForm";

const Login = () => {
  return (
    <>
      <Header />
      <UserForm formType="login"/>
    </>
  );
};
export default Login;
