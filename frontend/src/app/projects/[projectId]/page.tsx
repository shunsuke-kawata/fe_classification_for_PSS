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
  executeContinuousClustering,
  getCompletedClusteringUsers,
  copyClusteringData,
  downloadClassificationResult,
  getClusteringCounts,
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

  // クラスタリング回数フィルタ関連
  const [availableClusteringCounts, setAvailableClusteringCounts] = useState<
    number[]
  >([]);
  const [imageClusteringCountsMap, setImageClusteringCountsMap] = useState<{
    [clustering_id: string]: number;
  }>({});
  const [selectedClusteringCount, setSelectedClusteringCount] = useState<
    number | null
  >(null);
  const [isCountDropdownOpen, setIsCountDropdownOpen] =
    useState<boolean>(false);

  // データコピー機能用のstate
  const [isCopyMode, setIsCopyMode] = useState<boolean>(false);
  const [completedUsers, setCompletedUsers] = useState<any[]>([]);
  const [selectedSourceUserId, setSelectedSourceUserId] = useState<
    number | null
  >(null);
  const [isLoadingCopy, setIsLoadingCopy] = useState<boolean>(false);
  const [isOpenCopyPullDown, setIsOpenCopyPullDown] = useState<boolean>(false); // コピーモード専用のプルダウン状態

  // 初期階層分類トグル用のstate（デフォルトはfalse）
  const [useHierarchicalClassification, setUseHierarchicalClassification] =
    useState<boolean>(false);

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

    // クラスタリング回数情報を取得
    const fetchCounts = async () => {
      try {
        const countsRes = await getClusteringCounts(
          Number(projectId),
          loginedUser.id as number
        );
        if (countsRes && countsRes.data) {
          setAvailableClusteringCounts(countsRes.data.available_counts || []);
          setImageClusteringCountsMap(countsRes.data.image_counts || {});
        }
      } catch (error) {
        console.error("クラスタリング回数情報の取得に失敗しました:", error);
      }
    };

    fetchCounts();

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

  // データコピーボタンのクリック処理
  const handleCopyButtonClick = async () => {
    // コピーモードに入る - 完了ユーザーを取得
    setIsLoadingCopy(true);
    try {
      const response = await getCompletedClusteringUsers(Number(projectId));
      if (response && response.data) {
        // 自分以外のユーザーをフィルタリング（自分自身にデータがあっても他のユーザーからコピー可能）
        const otherUsers = response.data.filter(
          (user: any) => user.user_id !== loginedUser.id
        );
        if (otherUsers.length === 0) {
          alert("コピー可能な他のユーザーが見つかりませんでした");
          return;
        }
        setCompletedUsers(otherUsers);
        setIsCopyMode(true);
        setIsOpenCopyPullDown(false); // コピーモード専用のプルダウンを閉じる
      } else {
        alert("完了したユーザーが見つかりませんでした");
      }
    } catch (error) {
      console.error("完了ユーザー取得エラー:", error);
      alert("完了したユーザーの取得に失敗しました");
    } finally {
      setIsLoadingCopy(false);
    }
  };

  // プルダウン用ラベル取得
  const getCountLabel = (count: number | null) => {
    if (count === null) return "全て";
    // 初期分類は 0 としてそのまま表示
    if (count === 0) return "0";
    // それ以外は数値のみ表示
    return `${count}`;
  };

  // コピーモードをキャンセル
  const handleCancelCopyMode = () => {
    setIsCopyMode(false);
    setSelectedSourceUserId(null);
    setCompletedUsers([]);
    setIsOpenCopyPullDown(false); // コピーモード専用のプルダウンを閉じる
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
              ["group", "reclassification"].includes(displayStatus)
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
                    {/* <input
                      type="button"
                      className="option-buttons delete-buttons"
                      value="削除"
                    /> */}
                  </>
                ) : displayStatus === "group" ? (
                  <>
                    {!isCopyMode ? (
                      <>
                        {/* クラスタリング回数プルダウン（ダウンロードボタンの左） */}
                        {availableClusteringCounts &&
                          availableClusteringCounts.length > 0 && (
                            <div
                              className="count-pulldown"
                              style={{
                                display: "inline-block",
                                marginRight: "10px",
                              }}
                            >
                              <div className="select-display-status">
                                <label className="select-status-label">
                                  {getCountLabel(selectedClusteringCount)}
                                </label>
                                <img
                                  className="pulldown-icon"
                                  src={
                                    isCountDropdownOpen
                                      ? "/assets/pulldown-open-icon.svg"
                                      : "/assets/pulldown-icon.svg"
                                  }
                                  alt=""
                                  onClick={() =>
                                    setIsCountDropdownOpen(!isCountDropdownOpen)
                                  }
                                />
                                {isCountDropdownOpen && (
                                  <div className="select-status-menu">
                                    <div
                                      onClick={() => {
                                        setSelectedClusteringCount(null);
                                        setIsCountDropdownOpen(false);
                                      }}
                                    >
                                      <label className="menu-content">
                                        <span>全て</span>
                                        {selectedClusteringCount === null && (
                                          <img
                                            className="checked-icon"
                                            src="/assets/checked-icon.svg"
                                            alt=""
                                          />
                                        )}
                                      </label>
                                    </div>
                                    {availableClusteringCounts.map((count) => (
                                      <div
                                        key={count}
                                        onClick={() => {
                                          setSelectedClusteringCount(count);
                                          setIsCountDropdownOpen(false);
                                        }}
                                      >
                                        <label className="menu-content">
                                          <span>{getCountLabel(count)}</span>
                                          {selectedClusteringCount ===
                                            count && (
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
                                )}
                              </div>
                            </div>
                          )}
                        {/* ダウンロードボタン - 初期クラスタリング完了時のみ表示 */}
                        {project.init_clustering_state ===
                          clusteringStatus.Finished && (
                          <input
                            type="button"
                            className="option-buttons clustering-buttons"
                            value="ダウンロード"
                            onClick={async () => {
                              if (typeof loginedUser.id !== "number") return;
                              try {
                                await downloadClassificationResult(
                                  project.id,
                                  loginedUser.id,
                                  project.name
                                );
                              } catch (error) {
                                console.error("ダウンロードエラー:", error);
                                alert("ダウンロードに失敗しました");
                              }
                            }}
                            style={{ width: "auto", padding: "0 10px" }}
                          />
                        )}
                        <input
                          type="button"
                          className={
                            project.init_clustering_state ===
                              clusteringStatus.Executing ||
                            project.init_clustering_state ===
                              clusteringStatus.Finished ||
                            imagesInProject.length === 0
                              ? "option-buttons locked-clustering-buttons"
                              : "option-buttons clustering-buttons"
                          }
                          value="初期"
                          disabled={
                            project.init_clustering_state ===
                              clusteringStatus.Executing ||
                            project.init_clustering_state ===
                              clusteringStatus.Finished ||
                            imagesInProject.length === 0
                          }
                          onClick={
                            typeof loginedUser.id === "number" &&
                            imagesInProject.length > 0
                              ? () => {
                                  executeInitClustering(
                                    project.id,
                                    loginedUser.id as number,
                                    useHierarchicalClassification
                                  );
                                  window.location.reload();
                                }
                              : () => {}
                          }
                          style={{
                            marginLeft: "10px",
                            width: "auto",
                            padding: "0 10px",
                          }}
                        />
                        {/* 初期階層分類トグル - 初期分類が可能な状態の時のみ表示 */}
                        {project.init_clustering_state !==
                          clusteringStatus.Executing &&
                          project.init_clustering_state !==
                            clusteringStatus.Finished &&
                          imagesInProject.length > 0 && (
                            <label
                              className="hierarchical-toggle-container"
                              style={{
                                marginLeft: "10px",
                                display: "inline-flex",
                                alignItems: "center",
                              }}
                            >
                              <div className="toggle-switch">
                                <input
                                  type="checkbox"
                                  checked={useHierarchicalClassification}
                                  onChange={(e) =>
                                    setUseHierarchicalClassification(
                                      e.target.checked
                                    )
                                  }
                                  className="toggle-checkbox"
                                />
                                <span className="toggle-slider"></span>
                              </div>
                            </label>
                          )}
                        {project.init_clustering_state ===
                          clusteringStatus.Finished &&
                          project.continuous_clustering_state === 2 && (
                            <input
                              type="button"
                              className="option-buttons clustering-buttons"
                              value="継続的"
                              onClick={
                                typeof loginedUser.id === "number"
                                  ? () => {
                                      executeContinuousClustering(
                                        project.id,
                                        loginedUser.id as number
                                      );
                                      window.location.reload();
                                    }
                                  : () => {}
                              }
                              style={{
                                marginLeft: "10px",
                                width: "auto",
                                padding: "0 10px",
                              }}
                            />
                          )}
                        <input
                          type="button"
                          className="option-buttons clustering-buttons"
                          value="コピー"
                          disabled={isLoadingCopy}
                          onClick={handleCopyButtonClick}
                          style={{
                            marginLeft: "10px",
                            width: "auto",
                            padding: "0 10px",
                          }}
                        />
                      </>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <div className="select-display-status">
                          <label className="select-status-label">
                            {selectedSourceUserId
                              ? completedUsers.find(
                                  (u: any) => u.user_id === selectedSourceUserId
                                )?.user_name || "ユーザを選択"
                              : "ユーザを選択"}
                          </label>
                          <img
                            className="pulldown-icon"
                            src={
                              isOpenCopyPullDown
                                ? "/assets/pulldown-open-icon.svg"
                                : "/assets/pulldown-icon.svg"
                            }
                            alt=""
                            onClick={() =>
                              setIsOpenCopyPullDown(!isOpenCopyPullDown)
                            }
                          />
                          {isOpenCopyPullDown && (
                            <div className="select-status-menu">
                              {completedUsers.map((user: any) => (
                                <div
                                  key={user.user_id}
                                  onClick={() => {
                                    setSelectedSourceUserId(user.user_id);
                                    setIsOpenCopyPullDown(false);
                                  }}
                                >
                                  <label className="menu-content">
                                    <span>
                                      {user.user_name} ({user.user_email})
                                    </span>
                                    {user.user_id === selectedSourceUserId && (
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
                          )}
                        </div>
                        <input
                          type="button"
                          className="option-buttons clustering-buttons"
                          value="コピー"
                          style={{
                            marginLeft: "10px",
                            width: "auto",
                            padding: "0 10px",
                          }}
                          disabled={!selectedSourceUserId || isLoadingCopy}
                          onClick={async () => {
                            if (!selectedSourceUserId) {
                              alert("コピー元のユーザーを選択してください");
                              return;
                            }

                            // 既存の分類結果がある場合は上書き確認
                            let confirmMessage =
                              "選択したユーザーのデータをコピーしますか？";
                            if (project?.init_clustering_state === 2) {
                              confirmMessage =
                                "既存の分類結果が上書きされます。\n選択したユーザーのデータをコピーしますか？";
                            }

                            if (!confirm(confirmMessage)) {
                              return;
                            }

                            setIsLoadingCopy(true);
                            try {
                              const response = await copyClusteringData(
                                selectedSourceUserId,
                                loginedUser.id as number,
                                Number(projectId)
                              );

                              if (
                                response &&
                                response.message ===
                                  "succeeded to copy clustering data"
                              ) {
                                window.location.reload();
                              } else {
                                alert("データのコピーに失敗しました");
                              }
                            } catch (error) {
                              console.error("データコピーエラー:", error);
                              alert("データのコピーに失敗しました");
                            } finally {
                              setIsLoadingCopy(false);
                            }
                          }}
                        />
                        <input
                          type="button"
                          className="option-buttons delete-buttons"
                          value="キャンセル"
                          onClick={handleCancelCopyMode}
                        />
                      </div>
                    )}
                  </>
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
                    ["group", "reclassification"].includes(displayStatus)
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
                projectId={project.id}
                userId={loginedUser.id as number}
                selectedClusteringCount={selectedClusteringCount}
                imageClusteringCounts={imageClusteringCountsMap}
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
