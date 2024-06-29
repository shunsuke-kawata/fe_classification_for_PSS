"use client";
import React, { useState } from "react";
import { projectMembershipType, projectType } from "@/api/api";
import "@/styles/AllComponentsStyle.css";
import { useRouter } from "next/navigation";
import JoinProjectModal from "./JoinProjectModal";
type projectListProps = {
  projects: projectType[];
};

const ProjectList: React.FC<projectListProps> = ({ projects }) => {
  const router = useRouter();
  const [isOpenJoinProjectModal, setIsOpenJoinProjectModal] =
    useState<boolean>(false);
  const [joinTargetProject, setJoinTargetProject] =
    useState<projectType | null>(null);
  const enterProject = (projectId: number) => {
    router.push(`/project/${projectId}`);
  };
  const openJoinProjectModal = (project: projectType) => {
    setJoinTargetProject(project);
    setIsOpenJoinProjectModal(true);
  };
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
      {isOpenJoinProjectModal && joinTargetProject !== null ? (
        <JoinProjectModal
          project={joinTargetProject}
          setIsOpenJoinProjectModal={setIsOpenJoinProjectModal}
        />
      ) : (
        <></>
      )}
    </>
  );
};

export default ProjectList;
