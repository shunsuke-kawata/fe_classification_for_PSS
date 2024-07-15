"use client";
import "@/app/globals.css";
import "./page.modules.css";
import config from "@/config/config.json";
import Header from "@/components/Header";
import ImageList from "@/components/ImageList";
import { getProject, projectType } from "@/api/api";
import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { getLoginedUser } from "@/utils/utils";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/lib/store";
import { setLoginedUser } from "@/lib/userReducer";
import { setSidebarStatus } from "@/lib/sidebarReducer";
const statusString: { [key in "origin" | "object" | "group"]: string } = {
  origin: "元画像一覧",
  object: "オブジェクト画像一覧",
  group: "分類結果一覧",
};

const ProjectDetail: React.FC = () => {
  const router = useRouter();
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<projectType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [displayStatus, setDisplayStatus] = useState<
    "origin" | "object" | "group"
  >("group");
  const [isOpenPullDown, setIsPullDown] = useState<boolean>(false);
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
        setProject(projectRes.data);
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

  useEffect(() => {}, [displayStatus]);

  const closePulldown = () => {
    setIsPullDown(false);
  };

  const handleChangeDisplayStatus = (status: "origin" | "object" | "group") => {
    setDisplayStatus(status);
    closePulldown();
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
      {project ? (
        <>
          <div className="project-detail-main">
            <div className="project-detail-title">{project.name}</div>
            <div className="menu-outer-flex">
              <div className="select-display-status">
                <label className="select-status-label">
                  {statusString[displayStatus]}
                </label>
                <img
                  className="pulldown-icon"
                  src={
                    isOpenPullDown
                      ? "/assets/pulldown-open-icon.svg"
                      : "/assets/pulldown-icon.svg"
                  }
                  alt=""
                  onClick={() => setIsPullDown(!isOpenPullDown)}
                />
                {isOpenPullDown ? (
                  <div className="select-status-menu">
                    {Object.entries(statusString).map(([key, value]) => (
                      <div
                        key={key}
                        onClick={() =>
                          handleChangeDisplayStatus(
                            key as "origin" | "object" | "group"
                          )
                        }
                      >
                        <label className="menu-content">
                          <span>{value}</span>
                          {key === displayStatus && (
                            <img
                              className="checked-icon"
                              src="/assets/checked-icon.svg"
                              alt=""
                            />
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <></>
                )}
              </div>
              <div className="option-buttons-div">
                {displayStatus === "origin" ? (
                  <>
                    <input
                      type="button"
                      className="option-buttons upload-buttons"
                      value="アップロード"
                    />
                    <input
                      type="button"
                      className="option-buttons delete-buttons"
                      value="削除"
                    />
                  </>
                ) : displayStatus === "object" ? (
                  <input
                    type="button"
                    className="option-buttons delete-buttons"
                    value="削除"
                  />
                ) : displayStatus == "group" ? (
                  <input
                    type="button"
                    className="option-buttons edit-buttons"
                    value="編集"
                  />
                ) : (
                  ""
                )}
              </div>
            </div>
            <div className="display-area">
              <ImageList displayStatus={displayStatus} />
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
