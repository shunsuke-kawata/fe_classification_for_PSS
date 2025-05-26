"use client";
import "@/app/globals.css";
import "./page.modules.css";
import config from "@/config/config.json";
import Header from "@/components/Header";
import ImageList from "@/components/ImageList";
import GroupList from "@/components/GroupList";
import { getProject, projectType, getImagesInProject } from "@/api/api";
import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { getLoginedUser } from "@/utils/utils";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/lib/store";
import { setLoginedUser } from "@/lib/userReducer";
import { setSidebarStatus } from "@/lib/sidebarReducer";
import UploadImageModal from "@/components/UploadImageModal";
const statusString: { [key in "object" | "group"]: string } = {
  object: "オブジェクト画像一覧",
  group: "分類結果一覧",
};

const ProjectDetail: React.FC = () => {
  //中間発表用の値を表示する
  const [originalImagesPath, setOriginalImagesPath] = useState<string[]>([]);
  const [objectImagesPath, setObjectImagesPath] = useState<string[]>([]);
  const [objectGroups, setObjectGroups] = useState<{
    [key: string]: string[];
  }>({});
  const [isOpenUploadImageModal, setIsOpenUploadImageModal] =
    useState<boolean>(false);
  //実際の研究ではデータベースからfetch

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
    const fetchProject = async () => {
      try {
        const projectRes = await getProject(projectId);
        setProject(projectRes.data);
        console.log(projectRes.data);
      } catch (error) {
        console.error("Failed to get projects:", error);
        router.push("/project");
      }
    };
    const fetchImagesInProject = async () => {
      try {
        const imageRes = await getImagesInProject(projectId);
      } catch (error) {
        console.error("Failed to get images in project :", error);
      }
    };

    fetchProject();
    fetchImagesInProject();

    //テストデータのパスをセット
    setOriginalImagesPath(config.images_path.original_images);
    setObjectImagesPath(Object.values(config.images_path.object_images).flat());
    setObjectGroups(config.images_path.object_images);
    if (!projectId) {
      router.push("/project");
    }
  }, [projectId]);

  useEffect(() => {}, [displayStatus]);
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
                // <ImageList imagesPath={objectImagesPath} />
                <></>
              ) : displayStatus === "group" ? (
                // <GroupList objectGroups={objectGroups} />
                <></>
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
