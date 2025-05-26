import React, { useEffect, useRef, useState } from "react";
import { projectType } from "@/api/api";
import "@/styles/AllComponentsStyle.css";
import { useRouter } from "next/navigation";
import JoinProjectModal from "./JoinProjectModal";

type ProjectListProps = {
  projects: projectType[];
};

const usePrevious = <T,>(value: T): T | undefined => {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
};

const ProjectList: React.FC<ProjectListProps> = ({ projects }) => {
  const router = useRouter();
  const [isOpenJoinProjectModal, setIsOpenJoinProjectModal] =
    useState<boolean>(false);
  const [joinTargetProject, setJoinTargetProject] =
    useState<projectType | null>(null);

  const prevIsOpen = usePrevious(isOpenJoinProjectModal);

  const enterProject = (projectId: number) => {
    router.push(`/project/${projectId}`);
  };

  const openJoinProjectModal = (project: projectType) => {
    setJoinTargetProject(project);
    setIsOpenJoinProjectModal(true);
  };

  useEffect(() => {
    if (prevIsOpen && !isOpenJoinProjectModal) {
      window.location.reload();
    }
  }, [isOpenJoinProjectModal, prevIsOpen]);

  return (
    <>
      <div className="project-list-main">
        {projects.map((project) => (
          <div
            key={project.id}
            className={`project-div ${
              project.joined ? "unlocked-project-div" : "locked-project-div"
            }`}
          >
            <div className="name-and-description">
              <div>
                <p className="project-name">{project.name}</p>
              </div>
              <p className="project-description">{project.description}</p>
            </div>
            <div
              className="to-project-button"
              onClick={
                project.joined
                  ? () => enterProject(project.id)
                  : () => openJoinProjectModal(project)
              }
            >
              →
            </div>
          </div>
        ))}
      </div>
      {isOpenJoinProjectModal && joinTargetProject !== null && (
        <JoinProjectModal
          project={joinTargetProject}
          setIsOpenJoinProjectModal={setIsOpenJoinProjectModal}
        />
      )}
    </>
  );
};

export default ProjectList;
