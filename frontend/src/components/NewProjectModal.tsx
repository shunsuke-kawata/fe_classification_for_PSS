"use client";
import { newProjectType } from "@/api/api";
import "@/styles/AllComponentsStyle.css";
import { useRef, useState } from "react";
import {
  postProject,
  postProjectMembership,
  newProjectMembershipType,
} from "@/api/api";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "@/lib/store";

//それぞれのバリデーション関数
const validateProjectName = (projectName: string): boolean => {
  return projectName.length > 0;
};
const validatePassword = (password: string): boolean => {
  return password.length >= 4;
};
const validateOwnerId = (ownerId: number | null): boolean => {
  return ownerId !== null;
};

type newProjectModalProps = {
  setIsOpenNewProjectModal: React.Dispatch<React.SetStateAction<boolean>>;
};
const NewProjectModal: React.FC<newProjectModalProps> = ({
  setIsOpenNewProjectModal,
}) => {
  const projectName = useRef<HTMLInputElement>(null);
  const description = useRef<HTMLInputElement>(null);
  const password = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const userInfo = useSelector(selectUser);
  const closeNewProjectModal = () => {
    setIsOpenNewProjectModal(false);
  };
  const onSubmitNewProject = async () => {
    const projectNameValue = projectName.current?.value || "";
    const passwordValue = password.current?.value || "";
    const descriptionValue = description.current?.value || "";

    const ownerIdValue = userInfo.id;

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
      owner_id: Number(ownerIdValue),
    };
    const projectRes = await postProject(newProject);
    if (projectRes.status === 201) {
      const projectId = projectRes.data.project_id;
      const ownerId = Number(ownerIdValue);
      const newProjectMembership: newProjectMembershipType = {
        project_id: projectId,
        user_id: ownerId,
      };
      const projectMembershipRes = await postProjectMembership(
        newProjectMembership
      );
      if (projectMembershipRes.status === 201) {
        closeNewProjectModal();
      } else {
        setErrorMessage(
          "プロジェクトは作成されましたが管理者ユーザの追加に失敗しました"
        );
      }
    } else {
      setErrorMessage("ユーザの新規登録に失敗しました");
    }
  };
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
      <div className="overlay"></div>
    </>
  );
};
export default NewProjectModal;
