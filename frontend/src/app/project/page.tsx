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
import { setSidebarStatus } from "@/lib/sidebarReducer";
import { useRouter } from "next/navigation";

const Projects: React.FC = () => {
  const router = useRouter();
  const [isOpenNewProjectModal, setIsOpenNewProjectModal] =
    useState<boolean>(false);
  const [projects, setProjects] = useState<projectType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch<AppDispatch>();
  const loginedUser = useSelector(selectUser);

  useEffect(() => {
    const initializeUser = async () => {
      const user = getLoginedUser();
      if (user) {
        dispatch(setLoginedUser(user));
        dispatch(setSidebarStatus(false));
      } else {
        router.push("/");
        return;
      }
      setIsLoading(false);
    };

    initializeUser();
  }, [dispatch]);

  useEffect(() => {
    const getAllProjects = async () => {
      try {
        const userId = loginedUser.id;
        const url = `${config.backend_base_url}/projects`;
        const allProjects = await getData(url, { user_id: userId });
        setProjects(allProjects);
      } catch (error) {
        console.error("Failed to get projects:", error);
      }
    };

    if (!isLoading) {
      getAllProjects();
    }
  }, [isOpenNewProjectModal, loginedUser, isLoading]);

  const openNewProjectModal = () => {
    setIsOpenNewProjectModal(true);
  };

  if (isLoading) {
    return (
      <>
        <Header />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="project-main-div">
        <input
          type="button"
          className={`add-project-button ${
            loginedUser.authority ? "common-buttons" : "locked-common-buttons"
          }`}
          value="作成    ＋"
          onClick={() => openNewProjectModal()}
          disabled={!loginedUser.authority}
        />
        <ProjectList projects={projects} />
      </div>
      {isOpenNewProjectModal ? (
        <NewProjectModal setIsOpenNewProjectModal={setIsOpenNewProjectModal} />
      ) : null}
    </>
  );
};

export default Projects;
