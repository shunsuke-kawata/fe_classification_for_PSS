"use client";
import { useState, useEffect } from "react";
import "./page.modules.css";
import Header from "@/components/Header";
import config from "@/config/config.json";
import { getData, getProjectMembership } from "@/api/api";
import NewProjectModal from "@/components/NewProjectModal";
import {
  projectType,
  projectMembershipParamType,
  projectMembershipType,
} from "@/api/api";
import ProjectList from "@/components/ProjectList";
import { getCookie } from "cookies-next";

const Projects = () => {
  const [isOpenNewProjectModal, setIsOpenNewProjectModal] =
    useState<boolean>(false);
  const [projects, setProjects] = useState<projectType[]>([]);
  const [projectMemberships, setProjectMemberships] = useState<
    projectMembershipType[]
  >([]);

  useEffect(() => {
    const getAllProjects = async () => {
      try {
        const url = `${config.backend_base_url}/projects`;
        const allProjects = await getData(url);
        setProjects(allProjects);
      } catch (error) {
        console.error("Failed to get projects:", error);
      }
    };
    getAllProjects();
  }, [isOpenNewProjectModal]);

  //紐付けテーブルの取得
  useEffect(() => {
    const getJoinedProject = async () => {
      try {
        const userId = getCookie("id");
        const params: projectMembershipParamType = {
          user_id: Number(userId),
          project_id: null,
        };
        const myProjectMemberships = await getProjectMembership(params);
        setProjectMemberships(myProjectMemberships);
      } catch (error) {
        console.error("Failed to get project memberships:", error);
      }
    };
    getJoinedProject();
  }, [isOpenNewProjectModal]);

  const openNewProjectModal = () => {
    setIsOpenNewProjectModal(true);
  };

  return (
    <>
      <Header />
      <div className="project-main-div">
        <input
          type="button"
          className="common-buttons add-project-button"
          value="作成    ＋"
          onClick={() => openNewProjectModal()}
        />

        <ProjectList
          projects={projects}
          projectMemberships={projectMemberships}
        />
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
