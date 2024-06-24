"use client";
import config from "@/config/config.json";
import "@/styles/AllComponentsStyle.css";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

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

const UserForm = ({ formType }: { formType: string }) => {
  const router = useRouter();
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

  const onSubmitSignup = () => {
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
    console.log("Signup", {
      emailValue,
      handleNameValue,
      passwordValue,
      isAdminUser,
    });
  };

  const onSubmitLogin = () => {
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
    console.log("Login", {
      emailValue,
      handleNameValue,
      passwordValue,
    });
  };

  return (
    <>
      <div className="user-form-main">
        <label className="user-form-title">
          {formType === "signin" ? "新規登録" : "ログイン"}
        </label>
        <div className="input-form">
          {formType === "signin" ? (
            <>
              <div className="user-form-contents">
                <label className="user-form-label" htmlFor="name">
                  メールアドレス
                </label>
                <input
                  className="user-form-input"
                  type="text"
                  autoComplete="off"
                  placeholder="メールアドレスを入力してください"
                  ref={email}
                />
              </div>
              <div className="user-form-contents">
                <label className="user-form-label" htmlFor="name">
                  ハンドルネーム
                </label>
                <input
                  className="user-form-input"
                  type="text"
                  autoComplete="off"
                  placeholder="ハンドルネームを入力してください"
                  ref={handleName}
                />
              </div>
              <div className="user-form-contents">
                <label className="user-form-label" htmlFor="password">
                  パスワード
                </label>
                <input
                  className="user-form-input"
                  type="password"
                  autoComplete="off"
                  placeholder="パスワードを入力してください"
                  ref={password}
                />
              </div>
              <div className="user-form-contents">
                <label htmlFor="normal">一般ユーザ</label>
                <input
                  type="radio"
                  id="normal"
                  name="authority"
                  className="auth-radio-button"
                  value={0}
                  checked={!isAdminUser}
                  onChange={() => onChangeUserAuth(false)}
                />
                <label htmlFor="admin">管理者ユーザ</label>
                <input
                  type="radio"
                  id="admin"
                  name="authority"
                  className="auth-radio-button"
                  value={1}
                  checked={isAdminUser}
                  onChange={() => onChangeUserAuth(true)}
                />
              </div>
              <div className="user-form-contents">
                <label className="user-form-label" htmlFor="administratorCode">
                  管理者コード
                </label>
                <input
                  className="user-form-input"
                  type="number"
                  autoComplete="off"
                  placeholder="管理者コードを入力してください"
                  disabled={!isAdminUser}
                  value={administratorCodeValue}
                  onChange={(e) => setAdministratorCodeValue(e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="user-form-contents">
                <label className="user-form-label" htmlFor="name">
                  メールアドレス or ハンドルネーム
                </label>
                <input
                  className="user-form-input"
                  type="text"
                  autoComplete="off"
                  placeholder="メールアドレスかハンドルネームを入力してください"
                  ref={emailOrhandleName}
                />
              </div>
              <div className="user-form-contents">
                <label className="user-form-label" htmlFor="password">
                  パスワード
                </label>
                <input
                  className="user-form-input"
                  type="password"
                  autoComplete="off"
                  placeholder="パスワードを入力してください"
                  ref={password}
                />
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
