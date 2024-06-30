"use client";
import "@/app/globals.css";
import Header from "@/components/Header";
import UserForm from "@/components/UserForm";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, selectUser } from "@/lib/store";
import { useEffect } from "react";
import { setSidebarStatus } from "@/lib/sidebarReducer";
const Signup: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const userInfo = useSelector(selectUser);
  useEffect(() => {
    dispatch(setSidebarStatus(false));
    console.log(userInfo);
  }, []);
  return (
    <>
      <Header />
      <UserForm formType="signin" />
    </>
  );
};
export default Signup;
