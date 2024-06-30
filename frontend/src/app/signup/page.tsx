"use client";
import "@/app/globals.css";
import Header from "@/components/Header";
import UserForm from "@/components/UserForm";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, selectUser } from "@/lib/store";
import { useEffect, useState } from "react";
import { setSidebarStatus } from "@/lib/sidebarReducer";
import { setLoginedUser } from "@/lib/userReducer";
import { getLoginedUser } from "@/utils/utils";
const Signup: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [isLoading, setIsLoading] = useState(true);
  const loginedUser = useSelector(selectUser);
  useEffect(() => {
    const initializeUser = async () => {
      const user = getLoginedUser();
      dispatch(setLoginedUser(user));
      dispatch(setSidebarStatus(false));
      setIsLoading(false);
      console.log(user);
    };

    initializeUser();
  }, [dispatch]);

  if (isLoading) {
    return (
      <>
        <Header />
      </>
    );
  }
  return (
    <>
      <Header />
      <UserForm formType="signin" />
    </>
  );
};
export default Signup;
