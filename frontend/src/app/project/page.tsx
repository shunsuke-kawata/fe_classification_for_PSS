"use client";
import { useState, useEffect } from "react";
import "@/app/globals.css";
import "./page.modules.css";
import Header from "@/components/Header";
import config from "@/config/config.json";
import { getData } from "@/api/api";
import NewProjectModal from "@/components/NewProjectModal";
import { projectType, projectMembershipType } from "@/api/api";
import ProjectList from "@/components/ProjectList";
import { getCookie } from "cookies-next";
import { useDispatch, useSelector } from "react-redux";
import { selectUser, AppDispatch } from "@/lib/store";
import { getLoginedUser } from "@/utils/utils";
import { setLoginedUser } from "@/lib/userReducer";

const Projects: React.FC = () => {
  const [isOpenNewProjectModal, setIsOpenNewProjectModal] =
    useState<boolean>(false);
  const [projects, setProjects] = useState<projectType[]>([]);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // Cookie からユーザー情報を取得し、Redux ストアに設定する
    const loginedUser = getLoginedUser();
    dispatch(setLoginedUser(loginedUser));

    const getAllProjects = async () => {
      try {
        const userId = getCookie("id");
        const url = `${config.backend_base_url}/projects`;
        const allProjects = await getData(url, { user_id: userId });
        setProjects(allProjects);
      } catch (error) {
        console.error("Failed to get projects:", error);
      }
    };
    getAllProjects();
  }, [dispatch, isOpenNewProjectModal]);

  const openNewProjectModal = () => {
    setIsOpenNewProjectModal(true);
  };

  const userInfo = useSelector(selectUser);
  useEffect(() => {
    console.log(userInfo); // userInfo が変更されたときにログに出力
  }, [userInfo]);

  return (
    <>
      <Header />
      <div className="project-main-div">
        <input
          type="button"
          className={`add-project-button ${
            userInfo.authority ? "common-buttons" : "locked-common-buttons"
          }`}
          value="作成    ＋"
          onClick={() => openNewProjectModal()}
          disabled={!userInfo.authority}
        />

        <ProjectList projects={projects} />
      </div>
      {isOpenNewProjectModal ? (
        <NewProjectModal setIsOpenNewProjectModal={setIsOpenNewProjectModal} />
      ) : (
        <></>
      )}
    </>
  );
};

export default Projects;
