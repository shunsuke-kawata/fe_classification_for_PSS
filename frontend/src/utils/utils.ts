import { LoginUserState } from "@/lib/userReducer";
import { deleteCookie, getCookie } from "cookies-next";

export const getLoginedUser = () => {
  const userId = getCookie("id");
  const userName = getCookie("name");
  const userEmail = getCookie("email");
  const userAuthority = getCookie("authority");
  const tmpUser: LoginUserState = {
    id: userId !== undefined ? Number(userId) : null,
    name: userName !== undefined ? userName : "",
    email: userEmail !== undefined ? userEmail : "",
    authority:
      userAuthority !== undefined ? Boolean(Number(userAuthority)) : false,
  };

  return tmpUser;
};

export const logout = () => {
  deleteCookie("id");
  deleteCookie("name");
  deleteCookie("email");
  deleteCookie("authority");
  console.log("logout");
};
