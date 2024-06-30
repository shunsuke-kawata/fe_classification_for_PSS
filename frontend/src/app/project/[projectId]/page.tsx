"use client";
import Header from "@/components/Header";
import "@/app/globals.css";
import "./page.modules.css";
import { getProject, projectType } from "@/api/api";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

const ProjectDetail: React.FC = () => {
  const router = useRouter();
  const { projectId } = useParams<{ projectId: string }>();

  const [project, setProject] = useState<projectType | null>(null);

  //プロジェクト情報の取得
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const projectRes = await getProject(projectId);
        setProject(projectRes);
      } catch (error) {
        console.error("Failed to get projects:", error);
        router.push("/project");
      }
    };

    fetchProject();
    if (!projectId) {
      router.push("/project");
    }
  }, [projectId]);

  return (
    <>
      <Header />
      {project ? (
        <>
          <div className="project-detail-main">
            <div className="project-detail-title">{project.name}</div>
          </div>
        </>
      ) : (
        <></>
      )}
    </>
  );
};

export default ProjectDetail;
