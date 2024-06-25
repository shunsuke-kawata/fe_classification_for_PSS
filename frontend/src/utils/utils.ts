import { setCookie } from "cookies-next";

type cookieType = {
  key: string;
  value: string | number | boolean;
  options: any;
};

const setCookieValue = (target: cookieType) => {
  setCookie(target.key, target.value, target.options);
};

export type { cookieType };
export { setCookieValue };
