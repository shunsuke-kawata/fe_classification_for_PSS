import React from "react";
import { projectType } from "@/api/api";
import "@/styles/AllComponentsStyle.css";
type ProjectListProps = {
  projects: projectType[];
};

const ProjectList: React.FC<ProjectListProps> = ({ projects }) => {
  return (
    <div className="project-list-main">
      {projects.map((project) => (
        <div key={project.id} className="project-button">
          <div className="name-and-description">
            <div>
              <p className="project-name">{project.name}</p>
            </div>
            <p className="project-description">{project.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectList;
