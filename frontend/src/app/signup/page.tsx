"use client";
import Header from "@/components/Header";
import UserForm from "@/components/UserForm";
const Signup: React.FC = () => {
  return (
    <>
      <Header />
      <UserForm formType="signin" />
    </>
  );
};
export default Signup;
