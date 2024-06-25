"use client";
import { useState, useEffect } from "react";
import "./page.modules.css";
import Header from "@/components/Header";
import config from "@/config/config.json";
import { getData } from "@/api/api";
import NewProjectModal from "@/components/NewProjectModal";
import { projectType } from "@/api/api";
import ProjectList from "@/components/ProjectList";

const Projects = () => {
  const [isOpenNewProjectModal, setIsOpenNewProjectModal] =
    useState<boolean>(false);
  const [projects, setProjects] = useState<projectType[]>([]);

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
  }, []);
  useEffect(() => {}, [projects]);

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
