"use client";
import "@/app/globals.css";
import Header from "@/components/Header";
import UserForm from "@/components/UserForm";
import { useSelector } from "react-redux";
import { selectUser } from "@/lib/store";
import { useEffect } from "react";
const Signup: React.FC = () => {
  const userInfo = useSelector(selectUser);
  useEffect(() => {
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
