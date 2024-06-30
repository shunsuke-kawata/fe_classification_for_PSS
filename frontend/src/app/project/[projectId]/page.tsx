"use client";
import Header from "@/components/Header";
import "@/app/globals.css";
import "./page.modules.css";
import { getProject, projectType } from "@/api/api";
import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { getLoginedUser } from "@/utils/utils";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/lib/store";
import { setLoginedUser } from "@/lib/userReducer";
import { setSidebarStatus } from "@/lib/sidebarReducer";

const ProjectDetail: React.FC = () => {
  const router = useRouter();
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<projectType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [displayStatus, setDisplayStatus] = useState<string>("origin");
  const dispatch = useDispatch<AppDispatch>();
  const loginedUser = getLoginedUser();

  useEffect(() => {
    const initializeUser = async () => {
      const user = getLoginedUser();
      console.log(user);

      dispatch(setLoginedUser(user));
      dispatch(setSidebarStatus(false));

      setIsLoading(false);
    };

    initializeUser();
  }, [dispatch]);

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
      {project ? (
        <>
          <div className="project-detail-main">
            <input
              type="button"
              className="project-detail-button upload-img-button common-buttons"
              value="アップロード"
            />
            <div className="project-detail-title">{project.name}</div>
            <div className="menu-outer-flex">
              <div className="select-display-status">表示状態選択ボタン</div>
              <div>表示状態に応じたメニュー表示</div>
            </div>
          </div>
        </>
      ) : (
        <></>
      )}
    </>
  );
};

export default ProjectDetail;
