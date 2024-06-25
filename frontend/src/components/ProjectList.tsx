import React, { useEffect } from "react";
import { projectMembershipType, projectType } from "@/api/api";
import "@/styles/AllComponentsStyle.css";
type ProjectListProps = {
  projects: projectType[];
  projectMemberships: projectMembershipType[];
};

const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  projectMemberships,
}) => {
  useEffect(() => {
    console.log(projectMemberships);
  }, []);
  return (
    <div className="project-list-main">
      {projects.map((project) => (
        <div key={project.id} className="project-div">
          <div className="name-and-description">
            <div>
              <p className="project-name">{project.name}</p>
            </div>
            <p className="project-description">{project.description}</p>
          </div>
          <div className="to-project-button">→</div>
        </div>
      ))}
    </div>
  );
};

export default ProjectList;
