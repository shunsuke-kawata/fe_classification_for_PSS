"use client";
import config from "@/config/config.json";
import "@/styles/AllComponentsStyle.css";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  executeLogin,
  loginUserType,
  postUser,
  signupUserType,
} from "@/api/api";
import { setCookie } from "cookies-next";
import { setLoginedUser, LoginUserState } from "@/lib/userReducer";
import { AppDispatch } from "@/lib/store";
import { useDispatch } from "react-redux";
import { getLoginedUser } from "@/utils/utils";

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateHandleName = (name: string): boolean => {
  return name.length > 0;
};

const validatePassword = (password: string): boolean => {
  return password.length >= 4;
};

const validateAdminCode = (code: string): boolean => {
  return parseInt(code) === config.administrator_code;
};

type UserFromProps = {
  formType: string;
};
const UserForm: React.FC<UserFromProps> = ({ formType }) => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [administratorCodeValue, setAdministratorCodeValue] =
    useState<string>("");
  const email = useRef<HTMLInputElement>(null);
  const handleName = useRef<HTMLInputElement>(null);
  const password = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const emailOrhandleName = useRef<HTMLInputElement>(null);

  const onChangeUserAuth = (isAdminUser: boolean) => {
    setIsAdminUser(isAdminUser);
    setAdministratorCodeValue(""); // Clear administrator code value when toggling
  };

  const onSubmitSignup = async () => {
    const emailValue = email.current?.value || "";
    const handleNameValue = handleName.current?.value || "";
    const passwordValue = password.current?.value || "";

    if (!validateEmail(emailValue)) {
      setErrorMessage("有効なメールアドレスを入力してください");
      return;
    }
    if (!validateHandleName(handleNameValue)) {
      setErrorMessage("ハンドルネームを入力してください");
      return;
    }
    if (!validatePassword(passwordValue)) {
      setErrorMessage("4文字以上のパスワードを入力してください");
      return;
    }
    if (isAdminUser && !validateAdminCode(administratorCodeValue)) {
      setErrorMessage("管理者コードが正しくありません");
      return;
    }
    setErrorMessage("");

    //新規登録処理
    const signupUser: signupUserType = {
      email: emailValue,
      name: handleNameValue,
      password: passwordValue,
      authority: isAdminUser,
    };
    const res = await postUser(signupUser);
    if (res.status === 201) {
      router.push("/login");
    } else {
      setErrorMessage("ユーザの新規登録に失敗しました");
    }
  };

  const onSubmitLogin = async () => {
    const emailOrhandleNameValue = emailOrhandleName.current?.value || "";
    const emailValue = emailOrhandleNameValue;
    const handleNameValue = emailOrhandleNameValue;
    const passwordValue = password.current?.value || "";
    if (!validateEmail(emailValue) && !validateHandleName(handleNameValue)) {
      setErrorMessage("メールアドレスかパスワードを正しく入力してください");
      return;
    }
    if (!validatePassword(passwordValue)) {
      setErrorMessage("4文字以上のパスワードを入力してください");
      return;
    }
    setErrorMessage("");
    //新規登録処理
    const loginUser: loginUserType = {
      email: emailValue,
      name: handleNameValue,
      password: passwordValue,
    };
    const res = await executeLogin(loginUser);
    if (res.status === 200) {
      //cookieにログイン情報を追加
      const userData = res.data;
      console.log(userData);

      const loginedUserInfo: LoginUserState = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        authority: userData.authority,
      };

      setCookie("id", userData.id);
      setCookie("name", userData.name);
      setCookie("email", userData.email);
      setCookie("authority", userData.authority);
      //storeにユーザ情報を入れる
      const tmpUser = getLoginedUser();
      dispatch(setLoginedUser(tmpUser));
      router.push("/project");
    } else {
      setErrorMessage("ログインに失敗しました");
    }
  };

  return (
    <>
      <div className="user-form-main">
        <label className="form-title">
          {formType === "signin" ? "新規登録" : "ログイン"}
        </label>
        <div className="input-form">
          {formType === "signin" ? (
            <>
              <div className="user-form-contents">
                <label className="user-form-label">
                  メールアドレス
                  <input
                    className="user-form-input"
                    type="text"
                    autoComplete="off"
                    placeholder="メールアドレスを入力してください"
                    ref={email}
                  />
                </label>
              </div>
              <div className="user-form-contents">
                <label className="user-form-label">
                  ハンドルネーム
                  <input
                    className="user-form-input"
                    type="text"
                    autoComplete="off"
                    placeholder="ハンドルネームを入力してください"
                    ref={handleName}
                  />
                </label>
              </div>
              <div className="user-form-contents">
                <label className="user-form-label">
                  パスワード
                  <input
                    className="user-form-input"
                    type="password"
                    autoComplete="off"
                    placeholder="パスワードを入力してください"
                    ref={password}
                  />
                </label>
              </div>
              <div className="user-form-contents">
                <label>
                  一般ユーザ
                  <input
                    type="radio"
                    id="normal"
                    name="authority"
                    className="auth-radio-button"
                    value={0}
                    checked={!isAdminUser}
                    onChange={() => onChangeUserAuth(false)}
                  />
                </label>
                <label>
                  管理者ユーザ
                  <input
                    type="radio"
                    id="admin"
                    name="authority"
                    className="auth-radio-button"
                    value={1}
                    checked={isAdminUser}
                    onChange={() => onChangeUserAuth(true)}
                  />
                </label>
              </div>
              <div className="user-form-contents">
                <label className="user-form-label">
                  管理者コード
                  <input
                    className="user-form-input"
                    type="number"
                    autoComplete="off"
                    placeholder="管理者コードを入力してください"
                    disabled={!isAdminUser}
                    value={administratorCodeValue}
                    onChange={(e) => setAdministratorCodeValue(e.target.value)}
                  />
                </label>
              </div>
            </>
          ) : (
            <>
              <div className="user-form-contents">
                <label className="user-form-label">
                  メールアドレス or ハンドルネーム
                  <input
                    className="user-form-input"
                    type="text"
                    autoComplete="off"
                    placeholder="メールアドレスかハンドルネームを入力してください"
                    ref={emailOrhandleName}
                  />
                </label>
              </div>
              <div className="user-form-contents">
                <label className="user-form-label">
                  パスワード
                  <input
                    className="user-form-input"
                    type="password"
                    autoComplete="off"
                    placeholder="パスワードを入力してください"
                    ref={password}
                  />
                </label>
              </div>
            </>
          )}
          <div className="error-div user-form-contents">
            <label className="error-sentence">{errorMessage}</label>
          </div>
        </div>
        <div className="user-form-buttons">
          <input
            type="button"
            className="common-buttons user-form-button"
            value="キャンセル"
            onClick={() => router.push("/")}
          />
          {formType === "signin" ? (
            <input
              type="button"
              className="common-buttons user-form-button right-button"
              value="登録"
              onClick={() => onSubmitSignup()}
            />
          ) : (
            <input
              type="button"
              className="common-buttons user-form-button right-button"
              value="ログイン"
              onClick={() => onSubmitLogin()}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default UserForm;
