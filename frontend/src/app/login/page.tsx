"use client";
import "@/app/globals.css";
import "./page.modules.css";
import Header from "@/components/Header";
import UserForm from "@/components/UserForm";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch, selectUser } from "@/lib/store";
import { useEffect, useState } from "react";
import { setSidebarStatus } from "@/lib/sidebarReducer";
import { getLoginedUser } from "@/utils/utils";
import { setLoginedUser } from "@/lib/userReducer";

const Login: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch<AppDispatch>();
  const loginedUser = getLoginedUser();
  useEffect(() => {
    const initializeUser = async () => {
      const user = getLoginedUser();
      dispatch(setLoginedUser(user));
      dispatch(setSidebarStatus(false));
      setIsLoading(false);
    };

    initializeUser();
  }, [dispatch]);
  return (
    <>
      <Header />
      <UserForm formType="login" />
    </>
  );
};
export default Login;
