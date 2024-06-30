"use client";
import "@/app/globals.css";
import "./page.modules.css";
import Header from "@/components/Header";
import UserForm from "@/components/UserForm";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch, selectUser } from "@/lib/store";
import { useEffect } from "react";
import { setSidebarStatus } from "@/lib/sidebarReducer";

const Login: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const userInfo = useSelector(selectUser);
  useEffect(() => {
    dispatch(setSidebarStatus(false));
    console.log(userInfo);
  }, []);
  return (
    <>
      <Header />
      <UserForm formType="login" />
    </>
  );
};
export default Login;
