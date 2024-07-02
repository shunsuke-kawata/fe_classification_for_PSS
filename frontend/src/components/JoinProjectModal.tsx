"use client";
import { executeJoinProject, joinUserType, projectType } from "@/api/api";
import "@/styles/AllComponentsStyle.css";
import { useRef, useState } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/lib/store";

type newProjectModalProps = {
  project: projectType;
  setIsOpenJoinProjectModal: React.Dispatch<React.SetStateAction<boolean>>;
};
const validatePassword = (password: string): boolean => {
  return password.length >= 4;
};
const JoinProjectModal: React.FC<newProjectModalProps> = ({
  project,
  setIsOpenJoinProjectModal,
}) => {
  const closeJoinProjectModal = () => {
    setIsOpenJoinProjectModal(false);
  };
  const password = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const userInfo = useSelector(selectUser);
  const onSubmitJoinProject = async () => {
    const passwordValue = password.current?.value || "";
    if (!validatePassword(passwordValue)) {
      setErrorMessage("4文字以上のパスワードを入力してください");
      return;
    }
    setErrorMessage("");
    const joinUser: joinUserType = {
      project_id: project.id,
      user_id: Number(userInfo.id),
      project_password: passwordValue,
    };
    const joinProjectRes = await executeJoinProject(project.id, joinUser);
    if (joinProjectRes.status === 200) {
      closeJoinProjectModal();
    } else {
      setErrorMessage("プロジェクト追加に失敗しました");
    }
  };
  return (
    <>
      <div className="join-project-modal-main">
        <label className="form-title">{project.name}</label>
        <div className="join-project-input-form">
          <div className="user-form-contents">
            <label className="user-form-label" htmlFor="password">
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
          <div className="error-div user-form-contents">
            <label className="error-sentence">{errorMessage}</label>
          </div>
        </div>
        <div className="user-form-buttons">
          <input
            type="button"
            className="common-buttons user-form-button"
            value="キャンセル"
            onClick={() => closeJoinProjectModal()}
          />

          <input
            type="button"
            className="common-buttons user-form-button right-button"
            value="追加"
            onClick={() => onSubmitJoinProject()}
          />
        </div>
      </div>
      <div className="overlay"></div>
    </>
  );
};

export default JoinProjectModal;
