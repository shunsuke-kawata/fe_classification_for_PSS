"use client";
import "@/app/globals.css";
import "./page.modules.css";
import Header from "@/components/Header/Header";
import ImageList from "@/components/ImageList/ImageList";
import { getProject, projectType, getImagesInProject } from "@/api/api";
import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { getLoginedUser } from "@/utils/utils";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/lib/store";
import { setLoginedUser } from "@/lib/userReducer";
import { setSidebarStatus } from "@/lib/sidebarReducer";
import UploadImageModal from "@/components/UploadImageModal/UploadImageModal";
import ClusteringResult from "@/components/ClusteringResult/CluesteringResult";
const statusString: { [key in "object" | "group"]: string } = {
  object: "オブジェクト画像一覧",
  group: "分類結果一覧",
};

export type imageInfo = {
  id: string;
  name: string;
  is_created_caption: boolean;
  caption: string;
  created_at: Date;
};

const ProjectDetail: React.FC = () => {
  const [isOpenUploadImageModal, setIsOpenUploadImageModal] =
    useState<boolean>(false);

  const router = useRouter();
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<projectType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [displayStatus, setDisplayStatus] = useState<"object" | "group">(
    "object"
  );
  const [isOpenPullDown, setIsPullDown] = useState<boolean>(false);
  const dispatch = useDispatch<AppDispatch>();
  const loginedUser = getLoginedUser();
  const [imagesInProject, setImagesInProject] = useState<imageInfo[]>([]);

  //ユーザ情報の読み込み
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
    const fetchProject = async (user_id: number) => {
      try {
        const projectRes = await getProject(projectId, user_id);
        setProject(projectRes.data);
      } catch (error) {
        console.error("Failed to get projects:", error);
        router.push("/projects");
      }
    };
    const fetchImagesInProject = async () => {
      try {
        const imageRes = await getImagesInProject(Number(projectId));
        const images: imageInfo[] = imageRes.data.map((img: any) => {
          return {
            id: img.id,
            name: img.name,
            is_created_caption: img.is_created_caption,
            caption: img.caption || "",
            created_at: new Date(img.created_at), // 必要なら parsedDate.date にしてもOK
            // 他に microseconds を使いたいなら parsedDate.microseconds を別途保存も可能
          };
        });
        setImagesInProject(images);
      } catch (error) {
        console.error("Failed to get images in project :", error);
      }
    };

    if (!loginedUser.id) return;

    fetchProject(loginedUser.id);
    fetchImagesInProject();

    if (!projectId) {
      router.push("/projects");
    }
  }, [projectId]);

  useEffect(() => {
    console.log(project);
  }, [project]);

  const closePulldown = () => {
    setIsPullDown(false);
  };

  const openUploadImageModal = () => {
    setIsOpenUploadImageModal(true);
  };

  const handleChangeDisplayStatus = (status: "object" | "group") => {
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
            <div className="project-title">{project.name}</div>
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
                          handleChangeDisplayStatus(key as "object" | "group")
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
                {displayStatus === "object" ? (
                  <>
                    <input
                      type="button"
                      className="option-buttons upload-buttons"
                      value="アップロード"
                      onClick={() => openUploadImageModal()}
                    />
                    <input
                      type="button"
                      className="option-buttons delete-buttons"
                      value="削除"
                    />
                  </>
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
              {displayStatus === "object" ? (
                <ImageList
                  fullImageInfolist={imagesInProject}
                  originalImageFolderPath={project.original_images_folder_path}
                />
              ) : displayStatus === "group" ? (
                <ClusteringResult
                  mongoResultId={project.mongo_result_id}
                  initClusteringState={project.init_clustering_state}
                />
              ) : (
                <></>
              )}
            </div>
          </div>
        </>
      ) : (
        <></>
      )}
      {isOpenUploadImageModal ? (
        <UploadImageModal
          projectId={Number(projectId)}
          setIsUploadImageModalOpen={setIsOpenUploadImageModal}
        />
      ) : null}
    </>
  );
};

export default ProjectDetail;
