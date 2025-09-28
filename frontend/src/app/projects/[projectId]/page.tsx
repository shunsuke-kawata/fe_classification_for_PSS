"use client";
import "@/app/globals.css";
import "./page.modules.css";
import Header from "@/components/Header/Header";
import ImageList from "@/components/ImageList/ImageList";
import {
  getProject,
  projectType,
  getImagesInProject,
  executeInitClustering,
} from "@/api/api";
import { useEffect, useState, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { getLoginedUser } from "@/utils/utils";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/lib/store";
import { setLoginedUser } from "@/lib/userReducer";
import { setSidebarStatus } from "@/lib/sidebarReducer";
import UploadImageModal from "@/components/UploadImageModal/UploadImageModal";
import ClusteringResult from "@/components/ClusteringResult/CluesteringResult";
import ReclassificationInterface from "@/components/ReclassificationInterface/ReclassificationInterface";
import { clusteringStatus } from "@/config";

const statusString: {
  [key in "object" | "group" | "reclassification"]: string;
} = {
  object: "オブジェクト画像一覧",
  group: "分類結果一覧",
  reclassification: "再分類",
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
  const searchParams = useSearchParams();
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<projectType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // クエリパラメータから初期値を取得
  const getInitialDisplayStatus = ():
    | "object"
    | "group"
    | "reclassification" => {
    const displayParam = searchParams.get("display");
    if (displayParam === "group" || displayParam === "reclassification") {
      return displayParam;
    }
    return "object"; // デフォルト値
  };

  const [displayStatus, setDisplayStatus] = useState<
    "object" | "group" | "reclassification"
  >(getInitialDisplayStatus());
  const [isOpenPullDown, setIsPullDown] = useState<boolean>(false);
  const dispatch = useDispatch<AppDispatch>();
  const loginedUser = getLoginedUser();
  const [imagesInProject, setImagesInProject] = useState<imageInfo[]>([]);

  // クエリパラメータを更新する関数
  const updateQueryParam = (
    status: "object" | "group" | "reclassification",
    targetFolder?: string,
    destinationFolder?: string,
    currentFolder?: string
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("display", status);

    // フォルダ移動のパラメータを追加
    if (targetFolder) {
      params.set("t_folder", targetFolder);
    } else {
      params.delete("t_folder");
    }

    if (destinationFolder) {
      params.set("d_folder", destinationFolder);
    } else {
      params.delete("d_folder");
    }

    // カレントフォルダのパラメータを追加
    if (currentFolder) {
      params.set("c_folder", currentFolder);
    } else {
      params.delete("c_folder");
    }

    router.replace(`${window.location.pathname}?${params.toString()}`, {
      scroll: false,
    });
  };

  // フォルダ移動後のリダイレクト用関数
  const handleFolderMoveRedirect = (
    targetFolder: string,
    destinationFolder: string
  ) => {
    // 再分類画面にリダイレクトし、移動に関連するパラメータを追加
    updateQueryParam("reclassification", targetFolder, destinationFolder);
  };

  // フォルダ変更時の関数（再分類画面で常にt_folder, d_folderを更新）
  const handleFolderChange = (
    beforeFolderId: string,
    afterFolderId: string
  ) => {
    if (displayStatus === "reclassification") {
      updateQueryParam("reclassification", beforeFolderId, afterFolderId);
    }
  };

  // 分類結果一覧モードでのカレントフォルダ変更
  const handleCurrentFolderChange = (currentFolderId: string) => {
    if (displayStatus === "group") {
      updateQueryParam("group", undefined, undefined, currentFolderId);
    }
  };

  //ユーザ情報の読み込み
  useEffect(() => {
    const initializeUser = async () => {
      const user = getLoginedUser();

      dispatch(setLoginedUser(user));
      dispatch(setSidebarStatus(false));

      setIsLoading(false);
    };

    initializeUser();
  }, [dispatch]);

  // クエリパラメータの変更を監視
  useEffect(() => {
    const newDisplayStatus = getInitialDisplayStatus();
    setDisplayStatus(newDisplayStatus);
  }, [searchParams]);

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
    // プロジェクト情報の監視（デバッグログ削除）
  }, [project]);

  const closePulldown = () => {
    setIsPullDown(false);
  };

  const openUploadImageModal = () => {
    setIsOpenUploadImageModal(true);
  };

  const handleChangeDisplayStatus = (
    status: "object" | "group" | "reclassification"
  ) => {
    setDisplayStatus(status);
    updateQueryParam(status);
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
          <div
            className={`project-detail-main ${
              displayStatus === "group" || displayStatus === "reclassification"
                ? "no-scroll"
                : ""
            }`}
          >
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
                          handleChangeDisplayStatus(
                            key as "object" | "group" | "reclassification"
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
                ) : displayStatus === "group" ? (
                  <input
                    type="button"
                    className={
                      project.init_clustering_state ===
                        clusteringStatus.Executing ||
                      project.init_clustering_state ===
                        clusteringStatus.Finished
                        ? "option-buttons locked-clustering-buttons"
                        : "option-buttons clustering-buttons"
                    }
                    value="初期クラスタリング"
                    disabled={
                      project.init_clustering_state ===
                        clusteringStatus.Executing ||
                      project.init_clustering_state ===
                        clusteringStatus.Finished
                    }
                    onClick={
                      typeof loginedUser.id === "number"
                        ? () => {
                            executeInitClustering(
                              project.id,
                              loginedUser.id as number
                            );
                            window.location.reload();
                          }
                        : () => {}
                    }
                  />
                ) : (
                  ""
                )}
              </div>
            </div>

            {displayStatus === "object" ? (
              <>
                {/* <div className="images-count">
                  画像枚数合計：{imagesInProject.length}
                </div> */}
                <div
                  className={`display-area ${
                    displayStatus === "group" ||
                    displayStatus === "reclassification"
                      ? "no-scroll"
                      : ""
                  }`}
                >
                  <ImageList
                    fullImageInfolist={imagesInProject}
                    originalImageFolderPath={
                      project.original_images_folder_path
                    }
                  />
                </div>
              </>
            ) : displayStatus === "group" ? (
              <ClusteringResult
                mongoResultId={project.mongo_result_id}
                initClusteringState={project.init_clustering_state}
                originalImageFolderPath={project.original_images_folder_path}
                currentFolder={searchParams.get("c_folder")}
                onCurrentFolderChange={handleCurrentFolderChange}
              />
            ) : displayStatus === "reclassification" ? (
              <ReclassificationInterface
                mongoResultId={project.mongo_result_id}
                initClusteringState={project.init_clustering_state}
                originalImageFolderPath={project.original_images_folder_path}
                onFolderMoveComplete={handleFolderMoveRedirect}
                onFolderChange={handleFolderChange}
              />
            ) : (
              <></>
            )}
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
