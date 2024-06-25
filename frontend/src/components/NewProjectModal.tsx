"use client";
import { newProjectType } from "@/api/api";
import "@/styles/AllComponentsStyle.css";
import { useRef, useState } from "react";
import { postProject } from "@/api/api";
import { getCookie } from "cookies-next";

//それぞれのバリデーション関数
const validateProjectName = (projectName: string): boolean => {
  return projectName.length > 0;
};
const validatePassword = (password: string): boolean => {
  return password.length >= 4;
};
const validateOwnerId = (ownerId: string): boolean => {
  const numericRegex = /^[+-]?\d+(\.\d+)?$/;
  return numericRegex.test(ownerId);
};

type NewProjectModalProps = {
  setIsOpenNewProjectModal: React.Dispatch<React.SetStateAction<boolean>>;
};
const NewProjectModal: React.FC<NewProjectModalProps> = ({
  setIsOpenNewProjectModal,
}) => {
  const projectName = useRef<HTMLInputElement>(null);
  const description = useRef<HTMLInputElement>(null);
  const password = useRef<HTMLInputElement>(null);

  const closeNewProjectModal = () => {
    setIsOpenNewProjectModal(false);
  };
  const onSubmitNewProject = async () => {
    const projectNameValue = projectName.current?.value || "";
    const passwordValue = password.current?.value || "";
    const descriptionValue = description.current?.value || "";

    const userId = getCookie("id");
    const ownerIdValue = userId || "";
    console.log(ownerIdValue);

    //プロジェクト名とパスワードについてバリデーションを行い、説明に関しては特に行わない
    if (!validateProjectName(projectNameValue)) {
      setErrorMessage("プロジェクト名を入力してください");
      return;
    }
    if (!validatePassword(passwordValue)) {
      setErrorMessage("4文字以上のパスワードを入力してください");
      return;
    }
    if (!validateOwnerId(ownerIdValue)) {
      setErrorMessage("ログイン情報が間違っています");
      return;
    }
    setErrorMessage("");
    //新規登録処理
    const newProject: newProjectType = {
      name: projectNameValue,
      password: passwordValue,
      description: descriptionValue,
      owner_id: 1,
    };
    const res = await postProject(newProject);
    if (res.status === 204) {
      closeNewProjectModal();
    } else {
      setErrorMessage("ユーザの新規登録に失敗しました");
    }
  };
  const [errorMessage, setErrorMessage] = useState<string>("");
  return (
    <>
      <div className="new-project-modal-main">
        <label className="form-title">新規作成</label>
        <div className="input-form">
          <div className="user-form-contents">
            <label className="user-form-label" htmlFor="name">
              プロジェクト名
            </label>
            <input
              className="user-form-input"
              type="text"
              autoComplete="off"
              placeholder="プロジェクト名を入力してください"
              ref={projectName}
            />
          </div>
          <div className="user-form-contents">
            <label className="user-form-label" htmlFor="description">
              説明
            </label>
            <input
              className="user-form-input"
              type="text"
              autoComplete="off"
              placeholder="プロジェクトの説明を入力してください"
              ref={description}
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
          <div className="error-div user-form-contents">
            <label className="error-sentence">{errorMessage}</label>
          </div>
        </div>

        <div className="user-form-buttons">
          <input
            type="button"
            className="common-buttons user-form-button"
            value="キャンセル"
            onClick={() => closeNewProjectModal()}
          />

          <input
            type="button"
            className="common-buttons user-form-button right-button"
            value="作成"
            onClick={() => onSubmitNewProject()}
          />
        </div>
      </div>
    </>
  );
};
export default NewProjectModal;
