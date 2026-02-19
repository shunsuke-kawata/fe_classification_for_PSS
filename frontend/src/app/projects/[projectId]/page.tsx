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
import CustomDialog from "@/components/CustomDialog/CustomDialog";
import { clusteringStatus } from "@/config";
import config from "@/config/config.json";

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

type MeasurementEvent = {
  timestamp: string;
  eventType: string;
  description: string;
  eventDetails: string;
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

  // デバッグ: availableClusteringCountsの変更を監視
  useEffect(() => {
    console.log("🔍 availableClusteringCounts 更新:", {
      counts: availableClusteringCounts,
      length: availableClusteringCounts.length,
      プルダウン表示: availableClusteringCounts.length > 0,
    });
  }, [availableClusteringCounts]);

  // ファイル名フィルタ関連
  const [availableFileNames, setAvailableFileNames] = useState<string[]>([]);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isFileNameDropdownOpen, setIsFileNameDropdownOpen] =
    useState<boolean>(false);

  // クラスタリング回数が変更されたらファイル名フィルタをリセット
  useEffect(() => {
    setSelectedFileName(null);
  }, [selectedClusteringCount]);

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

  // トグル用のstate(デフォルトはfalse)
  const [isExperimentalMode, setIsExperimentalMode] = useState<boolean>(false);

  // 計測モード用のstate
  const [isMeasuring, setIsMeasuring] = useState<boolean>(false);
  const [measurementData, setMeasurementData] = useState<MeasurementEvent[]>(
    [],
  );
  const [isMeasurementComplete, setIsMeasurementComplete] =
    useState<boolean>(false);
  const measurementStartTimeRef = useRef<string>("");
  const firstActionTimeRef = useRef<string>("");
  const lastActionTimeRef = useRef<string>("");
  const [folderClickCount, setFolderClickCount] = useState<number>(0);
  const [upNavigationCount, setUpNavigationCount] = useState<number>(0);
  const [openLeafFolderCount, setOpenLeafFolderCount] = useState<number>(0);
  const [revisitCount, setRevisitCount] = useState<number>(0);
  const [visitedFolders, setVisitedFolders] = useState<Set<string>>(new Set());
  const [selectedAlphabet, setSelectedAlphabet] = useState<string>("A");

  // 新規追加：スクロール計測用
  const [scrollCount, setScrollCount] = useState<number>(0);
  const [totalScrollDistance, setTotalScrollDistance] = useState<number>(0);
  const lastScrollPositionRef = useRef<number>(0);
  const scrollStartPositionRef = useRef<number>(0);
  const scrollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isScrollingRef = useRef<boolean>(false);

  // 新規追加：迷い時間計測用
  const actionTimestampsRef = useRef<number[]>([]);

  // 新規追加：最初に開いたフォルダが正解かのフラグ
  const firstOpenedFolderRef = useRef<string | null>(null);
  const [isFirstFolderCorrect, setIsFirstFolderCorrect] =
    useState<boolean>(false);

  // カスタムダイアログ用の状態
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const pendingMeasurementDataRef = useRef<MeasurementEvent[] | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");
  const [folderImagesList, setFolderImagesList] = useState<string[]>([]);
  const [currentFolderPath, setCurrentFolderPath] = useState<string>("");

  // デバッグ: isDialogOpenの変更を監視
  useEffect(() => {
    console.log("🎯 isDialogOpen が変更されました:", isDialogOpen);
  }, [isDialogOpen]);

  // クエリパラメータを更新する関数
  const updateQueryParam = (
    status: "object" | "group" | "reclassification",
    targetFolder?: string,
    destinationFolder?: string,
    currentFolder?: string,
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
    destinationFolder: string,
  ) => {
    // 再分類画面にリダイレクトし、移動に関連するパラメータを追加
    updateQueryParam("reclassification", targetFolder, destinationFolder);
  };

  // フォルダ変更時の関数（再分類画面で常にt_folder, d_folderを更新）
  const handleFolderChange = (
    beforeFolderId: string,
    afterFolderId: string,
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
        console.log("🔍 クラスタリング回数取得開始:", {
          projectId: Number(projectId),
          userId: loginedUser.id,
        });
        const countsRes = await getClusteringCounts(
          Number(projectId),
          loginedUser.id as number,
        );
        console.log("🔍 クラスタリング回数取得レスポンス:", countsRes);
        if (countsRes && countsRes.data) {
          console.log("🔍 available_counts:", countsRes.data.available_counts);
          console.log("🔍 image_counts:", countsRes.data.image_counts);
          setAvailableClusteringCounts(countsRes.data.available_counts || []);
          setImageClusteringCountsMap(countsRes.data.image_counts || {});
        } else {
          console.warn("⚠️ countsRes または countsRes.data が空です");
        }
      } catch (error) {
        console.error("❌ クラスタリング回数情報の取得に失敗しました:", error);
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
    status: "object" | "group" | "reclassification",
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
          (user: any) => user.user_id !== loginedUser.id,
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

  // 計測終了処理（データ生成のみ、アラート・ダウンロードなし）
  const createMeasurementData = () => {
    const endTime = new Date().toISOString();

    // 時間関連の指標を計算
    const startMs = new Date(measurementStartTimeRef.current).getTime();
    const endMs = new Date(endTime).getTime();
    const taskDuration = endMs - startMs;

    let timeToFirstAction = 0;
    if (firstActionTimeRef.current) {
      const firstActionMs = new Date(firstActionTimeRef.current).getTime();
      timeToFirstAction = firstActionMs - startMs;
    }

    let idleTimeAfterLastAction = 0;
    if (lastActionTimeRef.current) {
      const lastActionMs = new Date(lastActionTimeRef.current).getTime();
      idleTimeAfterLastAction = endMs - lastActionMs;
    }

    // タイムスタンプ指標を追加
    const measurementStartTimestampEvent: MeasurementEvent = {
      timestamp: measurementStartTimeRef.current,
      eventType: "measurement_start_timestamp",
      description: "計測開始時刻",
      eventDetails: measurementStartTimeRef.current,
    };
    const firstActionTimestampEvent: MeasurementEvent = {
      timestamp: firstActionTimeRef.current || "",
      eventType: "first_action_timestamp",
      description: "最初のアクション時刻",
      eventDetails: firstActionTimeRef.current || "N/A",
    };
    const lastActionTimestampEvent: MeasurementEvent = {
      timestamp: lastActionTimeRef.current || "",
      eventType: "last_action_timestamp",
      description: "最後のアクション時刻",
      eventDetails: lastActionTimeRef.current || "N/A",
    };
    const measurementEndTimestampEvent: MeasurementEvent = {
      timestamp: endTime,
      eventType: "measurement_end_timestamp",
      description: "計測終了時刻",
      eventDetails: endTime,
    };

    const totalClicksEvent: MeasurementEvent = {
      timestamp: endTime,
      eventType: "total_clicks",
      description: "フォルダクリック総回数",
      eventDetails: `${folderClickCount}`,
    };
    const upNavEvent: MeasurementEvent = {
      timestamp: endTime,
      eventType: "up_navigation_count",
      description: "上位階層への移動回数",
      eventDetails: `${upNavigationCount}`,
    };
    const leafFolderEvent: MeasurementEvent = {
      timestamp: endTime,
      eventType: "open_leaf_folder_count",
      description: "リーフフォルダ展開回数",
      eventDetails: `${openLeafFolderCount}`,
    };
    const revisitEvent: MeasurementEvent = {
      timestamp: endTime,
      eventType: "revisit_count",
      description: "フォルダ再訪問回数",
      eventDetails: `${revisitCount}`,
    };
    const taskDurationEvent: MeasurementEvent = {
      timestamp: endTime,
      eventType: "task_duration",
      description: "タスク全体の所要時間(ms)",
      eventDetails: `${taskDuration}`,
    };
    const timeToFirstActionEvent: MeasurementEvent = {
      timestamp: endTime,
      eventType: "time_to_first_action",
      description: "計測開始から最初のアクションまでの時間(ms)",
      eventDetails: `${timeToFirstAction}`,
    };
    const idleTimeEvent: MeasurementEvent = {
      timestamp: endTime,
      eventType: "idle_time_after_last_action",
      description: "最後のアクションから計測終了までの時間(ms)",
      eventDetails: `${idleTimeAfterLastAction}`,
    };
    const isNotUpEvent: MeasurementEvent = {
      timestamp: endTime,
      eventType: "isNotUp",
      description: "上位階層への移動なし(1=なし/0=あり)",
      eventDetails: `${upNavigationCount === 0 ? 1 : 0}`,
    };

    // 新規追加：スクロール関連
    const scrollCountEvent: MeasurementEvent = {
      timestamp: endTime,
      eventType: "scroll_count",
      description: "リストをスクロールした回数",
      eventDetails: `${scrollCount}`,
    };
    const totalScrollDistanceEvent: MeasurementEvent = {
      timestamp: endTime,
      eventType: "total_scroll_distance",
      description: "総スクロール距離(px)",
      eventDetails: `${Math.round(totalScrollDistance)}`,
    };

    // 新規追加：迷い時間の計算
    const hesitationTimes: number[] = [];
    for (let i = 1; i < actionTimestampsRef.current.length; i++) {
      const timeDiff =
        actionTimestampsRef.current[i] - actionTimestampsRef.current[i - 1];
      hesitationTimes.push(timeDiff);
    }

    const avgHesitationTime =
      hesitationTimes.length > 0
        ? hesitationTimes.reduce((sum, t) => sum + t, 0) /
          hesitationTimes.length
        : 0;

    const sortedHesitationTimes = [...hesitationTimes].sort((a, b) => a - b);
    const medianHesitationTime =
      sortedHesitationTimes.length > 0
        ? sortedHesitationTimes.length % 2 === 0
          ? (sortedHesitationTimes[sortedHesitationTimes.length / 2 - 1] +
              sortedHesitationTimes[sortedHesitationTimes.length / 2]) /
            2
          : sortedHesitationTimes[Math.floor(sortedHesitationTimes.length / 2)]
        : 0;

    const avgHesitationEvent: MeasurementEvent = {
      timestamp: endTime,
      eventType: "avg_hesitation_time",
      description: "アクション間の迷い時間の平均値(ms)",
      eventDetails: `${Math.round(avgHesitationTime)}`,
    };
    const medianHesitationEvent: MeasurementEvent = {
      timestamp: endTime,
      eventType: "median_hesitation_time",
      description: "アクション間の迷い時間の中央値(ms)",
      eventDetails: `${Math.round(medianHesitationTime)}`,
    };

    // 新規追加：最初に開いたフォルダが正解かどうか
    const firstFolderCorrectEvent: MeasurementEvent = {
      timestamp: endTime,
      eventType: "is_first_folder_correct",
      description: "最初に開いたフォルダが正解(1=正解/0=不正解)",
      eventDetails: `${isFirstFolderCorrect ? 1 : 0}`,
    };

    const newMeasurementData = [
      measurementStartTimestampEvent,
      firstActionTimestampEvent,
      lastActionTimestampEvent,
      measurementEndTimestampEvent,
      totalClicksEvent,
      upNavEvent,
      leafFolderEvent,
      revisitEvent,
      taskDurationEvent,
      timeToFirstActionEvent,
      idleTimeEvent,
      isNotUpEvent,
      scrollCountEvent,
      totalScrollDistanceEvent,
      avgHesitationEvent,
      medianHesitationEvent,
      firstFolderCorrectEvent,
    ];

    console.log(
      "計測終了",
      endTime,
      "total_clicks:",
      folderClickCount,
      "up_navigation:",
      upNavigationCount,
      "leaf_folder:",
      openLeafFolderCount,
      "revisit:",
      revisitCount,
      "task_duration:",
      taskDuration,
      "time_to_first_action:",
      timeToFirstAction,
      "idle_time:",
      idleTimeAfterLastAction,
    );

    return newMeasurementData;
  };

  // 計測終了処理（通常終了：データ保存のみ）
  const handleMeasurementEnd = () => {
    setIsMeasuring(false);
    setIsMeasurementComplete(true);
    const data = createMeasurementData();
    setMeasurementData(data);
  };

  // 計測終了処理（画像クリック時：アラート・ダウンロード付き）
  const handleMeasurementEndWithDownload = () => {
    console.log("✅ handleMeasurementEndWithDownload 開始");
    setIsMeasuring(false);
    setIsMeasurementComplete(true);
    const data = createMeasurementData();
    setMeasurementData(data);
    console.log("📊 計測データ生成完了:", data.length, "件");

    // カスタムダイアログを表示
    setTimeout(() => {
      console.log("🎯 ダイアログを表示します");

      // 選択された画像のURLを構築
      if (project && selectedFileName) {
        const imageUrl = `${config.backend_base_url}/images/${project.original_images_folder_path}/${selectedFileName}`;
        setSelectedImageUrl(imageUrl);
        console.log("🖼️ 画像URL設定:", imageUrl);
      }

      pendingMeasurementDataRef.current = data;
      setIsDialogOpen(true);
      console.log("🎯 isDialogOpen を true に設定しました");
    }, 100);
  };

  // ダイアログで「はい」を選択
  const handleDialogYes = () => {
    console.log(
      "✅ ダイアログで「はい」が選択されました（直感に合っている = 修正不要）",
    );
    setIsDialogOpen(false);
    if (pendingMeasurementDataRef.current) {
      console.log("📥 CSVダウンロード開始 (needsCustomization: false)");
      downloadMeasurementCSVWithData(pendingMeasurementDataRef.current, false);
      pendingMeasurementDataRef.current = null;
    }
  };

  // ダイアログで「いいえ」を選択
  const handleDialogNo = () => {
    console.log(
      "❌ ダイアログで「いいえ」が選択されました（直感に合っていない = 修正必要）",
    );
    setIsDialogOpen(false);
    if (pendingMeasurementDataRef.current) {
      console.log("📥 CSVダウンロード開始 (needsCustomization: true)");
      downloadMeasurementCSVWithData(pendingMeasurementDataRef.current, true);
      pendingMeasurementDataRef.current = null;
    }
  };

  // CSV出力関数（データを受け取るバージョン）
  const downloadMeasurementCSVWithData = (
    data: MeasurementEvent[],
    needsCustomization: boolean,
  ) => {
    if (data.length === 0) {
      alert("計測データがありません");
      return;
    }

    // アルファベットとユーザー名を追加
    const alphabetRow = ["alphabet", "アルファベット", selectedAlphabet];
    const usernameRow = [
      "username",
      "ユーザー名",
      loginedUser.name || "unknown",
    ];

    // カスタマイズ必要比率を追加（英語でneeds_customization_ratio）
    const needsCustomizationRow = [
      "needs_customization_ratio",
      "カスタマイズ必要比率",
      needsCustomization ? "true" : "false",
    ];

    // CSVデータ行（タイムスタンプなし、日本語説明を含む）
    const rows = data.map((event) => [
      event.eventType,
      event.description,
      event.eventDetails,
    ]);

    // アルファベット、ユーザー名、カスタマイズ必要比率を最初に追加
    const allRows = [alphabetRow, usernameRow, needsCustomizationRow, ...rows];

    // CSV文字列を作成（ヘッダーなし）
    const csvContent = allRows.map((row) => row.join(",")).join("\n");

    // BOMを付けてUTF-8として出力
    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    // ダウンロード
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, -5);
    const username = loginedUser.name || "unknown";
    const filenamePart = selectedFileName || "all";
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${selectedAlphabet}_${username}_${filenamePart}_${timestamp}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 画像クリックハンドラー（計測用・自動終了・ダウンロード）
  const handleImageClickForMeasurement = () => {
    console.log("🔍 handleImageClickForMeasurement が呼び出されました");
    console.log("🔍 isMeasuring:", isMeasuring);
    console.log("🔍 selectedFileName:", selectedFileName);

    if (!isMeasuring) {
      console.log("❌ 計測中ではありません");
      return;
    }

    // 計測中かつファイル名が選択されている場合のみ計測終了（アラート・ダウンロード付き）
    if (selectedFileName !== null) {
      console.log("✅ 計測終了処理を実行します");
      handleMeasurementEndWithDownload();
    } else {
      console.log("❌ ファイル名が選択されていません");
    }
  };

  // フォルダクリックハンドラー（計測用）
  const handleFolderClick = (
    folderId: string,
    currentFolderId: string,
    source: "breadcrumb" | "list",
    isUpNavigation: boolean = false,
  ) => {
    if (!isMeasuring) return;

    // パンくずリストで現在のフォルダと同じフォルダをクリックした場合はカウントしない
    if (source === "breadcrumb" && folderId === currentFolderId) {
      console.log("パンくずリスト: 同じフォルダをクリック - カウントしない");
      return;
    }

    const actionTime = new Date().toISOString();
    const actionTimestamp = Date.now();

    // 最初のアクション時刻を記録（まだ記録されていない場合）
    if (!firstActionTimeRef.current) {
      firstActionTimeRef.current = actionTime;
      console.log("最初のアクション時刻を記録:", actionTime);
    }

    // 最後のアクション時刻を更新
    lastActionTimeRef.current = actionTime;

    // アクション間隔を記録（迷い時間計測用）
    actionTimestampsRef.current.push(actionTimestamp);

    const newCount = folderClickCount + 1;
    setFolderClickCount(newCount);

    // 上位階層への移動をカウント
    if (isUpNavigation) {
      const newUpNavCount = upNavigationCount + 1;
      setUpNavigationCount(newUpNavCount);
      console.log(`上位階層への移動: 累計${newUpNavCount}回`);
    }

    // 移動先のフォルダが訪問済みかどうかをチェック
    if (visitedFolders.has(folderId)) {
      // 2回目以降の訪問
      const newRevisitCount = revisitCount + 1;
      setRevisitCount(newRevisitCount);
      console.log(`再訪問: ${folderId}, 累計${newRevisitCount}回`);
    } else {
      // 1回目の訪問 - 訪問履歴に追加
      setVisitedFolders((prev) => new Set(prev).add(folderId));
      console.log(`新規訪問: ${folderId}`);
    }

    console.log(`フォルダクリック: ${source}, 累計${newCount}回`);
  };

  // リーフフォルダ展開ハンドラー（計測用）
  const handleLeafFolderOpen = (folderId?: string) => {
    if (!isMeasuring) return;

    // 最初に開いたフォルダを記録
    if (firstOpenedFolderRef.current === null && folderId) {
      firstOpenedFolderRef.current = folderId;
      // 選択されたファイル名と一致するかチェック
      if (
        selectedFileName &&
        folderId.includes(selectedFileName.replace(/\.[^/.]+$/, ""))
      ) {
        setIsFirstFolderCorrect(true);
        console.log("最初に開いたフォルダが正解:", folderId);
      } else {
        setIsFirstFolderCorrect(false);
        console.log("最初に開いたフォルダが不正解:", folderId);
      }
    }

    const newCount = openLeafFolderCount + 1;
    setOpenLeafFolderCount(newCount);
    console.log(`リーフフォルダ展開: 累計${newCount}回`);
  };

  // スクロールハンドラー（計測用）
  const handleScroll = (scrollTop: number) => {
    if (!isMeasuring) return;

    // スクロール開始を検知
    if (!isScrollingRef.current) {
      // 新しいスクロール開始
      isScrollingRef.current = true;
      scrollStartPositionRef.current = lastScrollPositionRef.current;
      console.log("スクロール開始:", scrollStartPositionRef.current);
    }

    // 前回のタイマーをクリア
    if (scrollTimerRef.current) {
      clearTimeout(scrollTimerRef.current);
    }

    // スクロール停止を300ms後に検知
    scrollTimerRef.current = setTimeout(() => {
      const scrollDiff = Math.abs(scrollTop - scrollStartPositionRef.current);

      // 超微細なスクロール（10px以下）は除外
      if (scrollDiff > 10) {
        setScrollCount((prev) => prev + 1);
        setTotalScrollDistance((prev) => prev + scrollDiff);
        console.log(
          `スクロール完了: ${scrollDiff}px移動, 累計回数: ${
            scrollCount + 1
          }回, 累計距離: ${totalScrollDistance + scrollDiff}px`,
        );
      } else {
        console.log(`微細なスクロール(${scrollDiff}px)は除外`);
      }

      // スクロール終了をマーク
      isScrollingRef.current = false;
      lastScrollPositionRef.current = scrollTop;
    }, 300);
  };

  // CSV出力関数
  const downloadMeasurementCSV = () => {
    if (measurementData.length === 0) {
      alert("計測データがありません");
      return;
    }

    // アルファベットとユーザー名を追加
    const alphabetRow = ["alphabet", selectedAlphabet];
    const usernameRow = ["username", loginedUser.name || "unknown"];

    // CSVデータ行（タイムスタンプなし、日本語説明を含む）
    const rows = measurementData.map((event) => [
      event.eventType,
      event.description,
      event.eventDetails,
    ]);

    // アルファベットとユーザー名を最初に追加
    const allRows = [alphabetRow, usernameRow, ...rows];

    // CSV文字列を作成（ヘッダーなし）
    const csvContent = allRows.map((row) => row.join(",")).join("\n");

    // BOMを付けてUTF-8として出力
    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    // ダウンロード
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, -5);
    const username = loginedUser.name || "unknown";
    const filenamePart = selectedFileName || "all";
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${selectedAlphabet}_${username}_${filenamePart}_${timestamp}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              <div className="mode-selection-container">
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
                              key as "object" | "group" | "reclassification",
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
                <div className="experimental-mode-toggle">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={isExperimentalMode}
                      onChange={(e) => setIsExperimentalMode(e.target.checked)}
                      className="toggle-checkbox"
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
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
                        {/* ファイル名フィルタプルダウン（1つ目が「全て」以外の時のみ表示） */}
                        {selectedClusteringCount !== null &&
                          selectedClusteringCount !== undefined &&
                          availableFileNames &&
                          availableFileNames.length > 0 && (
                            <div
                              className="filename-pulldown"
                              style={{
                                display: "inline-block",
                                marginRight: "10px",
                              }}
                            >
                              <div className="select-display-status">
                                <label className="select-status-label">
                                  {selectedFileName || "全て"}
                                </label>
                                <img
                                  className="pulldown-icon"
                                  src={
                                    isFileNameDropdownOpen
                                      ? "/assets/pulldown-open-icon.svg"
                                      : "/assets/pulldown-icon.svg"
                                  }
                                  alt=""
                                  onClick={() =>
                                    setIsFileNameDropdownOpen(
                                      !isFileNameDropdownOpen,
                                    )
                                  }
                                />
                                {isFileNameDropdownOpen && (
                                  <div
                                    className="select-status-menu filename-menu"
                                    style={{
                                      maxHeight: "300px",
                                      overflowY: "auto",
                                    }}
                                  >
                                    <div
                                      onClick={() => {
                                        setSelectedFileName(null);
                                        setIsFileNameDropdownOpen(false);
                                      }}
                                    >
                                      <label className="menu-content">
                                        <span>全て</span>
                                        {selectedFileName === null && (
                                          <img
                                            className="checked-icon"
                                            src="/assets/checked-icon.svg"
                                            alt=""
                                          />
                                        )}
                                      </label>
                                    </div>
                                    {availableFileNames.map((fileName) => (
                                      <div
                                        key={fileName}
                                        onClick={() => {
                                          setSelectedFileName(fileName);
                                          setIsFileNameDropdownOpen(false);
                                        }}
                                      >
                                        <label className="menu-content">
                                          <span>{fileName}</span>
                                          {selectedFileName === fileName && (
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
                        {/* テストモード時の計測ボタン */}
                        {isExperimentalMode && (
                          <>
                            <input
                              type="button"
                              className={
                                isMeasuring || selectedFileName === null
                                  ? "option-buttons locked-clustering-buttons"
                                  : "option-buttons clustering-buttons"
                              }
                              value="計測開始"
                              disabled={
                                isMeasuring || selectedFileName === null
                              }
                              onClick={() => {
                                setIsMeasuring(true);
                                setIsMeasurementComplete(false);
                                setFolderClickCount(0);
                                setUpNavigationCount(0);
                                setOpenLeafFolderCount(0);
                                setRevisitCount(0);
                                setVisitedFolders(new Set());
                                const startTime = new Date().toISOString();
                                measurementStartTimeRef.current = startTime;
                                firstActionTimeRef.current = "";
                                lastActionTimeRef.current = "";
                                setMeasurementData([]);
                                // 新規追加項目の初期化
                                setScrollCount(0);
                                setTotalScrollDistance(0);
                                lastScrollPositionRef.current = 0;
                                scrollStartPositionRef.current = 0;
                                isScrollingRef.current = false;
                                if (scrollTimerRef.current) {
                                  clearTimeout(scrollTimerRef.current);
                                  scrollTimerRef.current = null;
                                }
                                actionTimestampsRef.current = [];
                                firstOpenedFolderRef.current = null;
                                setIsFirstFolderCorrect(false);
                                console.log("計測開始", startTime);
                              }}
                              style={{
                                width: "auto",
                                padding: "0 10px",
                              }}
                            />
                            <input
                              type="button"
                              className={
                                !isMeasuring
                                  ? "option-buttons locked-clustering-buttons"
                                  : "option-buttons clustering-buttons"
                              }
                              value="計測終了"
                              disabled={!isMeasuring}
                              onClick={handleMeasurementEnd}
                              style={{
                                marginLeft: "10px",
                                width: "auto",
                                padding: "0 10px",
                              }}
                            />
                            <input
                              type="button"
                              className={
                                !isMeasurementComplete
                                  ? "option-buttons locked-clustering-buttons"
                                  : "option-buttons clustering-buttons"
                              }
                              value="リセット"
                              disabled={!isMeasurementComplete}
                              onClick={() => {
                                setIsMeasuring(false);
                                setIsMeasurementComplete(false);
                                setMeasurementData([]);
                                setFolderClickCount(0);
                                setUpNavigationCount(0);
                                setOpenLeafFolderCount(0);
                                setRevisitCount(0);
                                setVisitedFolders(new Set());
                                measurementStartTimeRef.current = "";
                                firstActionTimeRef.current = "";
                                lastActionTimeRef.current = "";
                                // 新規追加項目のリセット
                                setScrollCount(0);
                                setTotalScrollDistance(0);
                                lastScrollPositionRef.current = 0;
                                scrollStartPositionRef.current = 0;
                                isScrollingRef.current = false;
                                if (scrollTimerRef.current) {
                                  clearTimeout(scrollTimerRef.current);
                                  scrollTimerRef.current = null;
                                }
                                actionTimestampsRef.current = [];
                                firstOpenedFolderRef.current = null;
                                setIsFirstFolderCorrect(false);
                                console.log(
                                  "リセット - 計測データをクリアしました",
                                );
                              }}
                              style={{
                                marginLeft: "10px",
                                width: "auto",
                                padding: "0 10px",
                              }}
                            />
                            {/* 計測完了後のダウンロードボタン */}
                            {isMeasurementComplete && (
                              <input
                                type="button"
                                className="option-buttons clustering-buttons"
                                value="計測データダウンロード"
                                onClick={downloadMeasurementCSV}
                                style={{
                                  marginLeft: "10px",
                                  width: "auto",
                                  padding: "0 10px",
                                  backgroundColor: "#28a745",
                                }}
                              />
                            )}
                          </>
                        )}

                        {!isExperimentalMode && (
                          <>
                            {/* ダウンロードボタン - 初期クラスタリング完了時のみ表示 */}
                            {project.init_clustering_state ===
                              clusteringStatus.Finished && (
                              <input
                                type="button"
                                className="option-buttons clustering-buttons"
                                value="ダウンロード"
                                onClick={async () => {
                                  if (typeof loginedUser.id !== "number")
                                    return;
                                  try {
                                    await downloadClassificationResult(
                                      project.id,
                                      loginedUser.id,
                                      project.name,
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
                                        useHierarchicalClassification,
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
                                          e.target.checked,
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
                                            loginedUser.id as number,
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
                        )}
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
                                  (u: any) =>
                                    u.user_id === selectedSourceUserId,
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
                                Number(projectId),
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
                isMeasuring={isMeasuring}
                onFolderClick={handleFolderClick}
                onLeafFolderOpen={handleLeafFolderOpen}
                onScroll={handleScroll}
                selectedAlphabet={selectedAlphabet}
                onAlphabetChange={setSelectedAlphabet}
                selectedFileName={selectedFileName}
                onFileNamesAvailable={setAvailableFileNames}
                onImageClickForMeasurement={handleImageClickForMeasurement}
                onFolderImagesUpdate={(images) => setFolderImagesList(images)}
                onCurrentFolderPathUpdate={(path) => setCurrentFolderPath(path)}
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

      <CustomDialog
        isOpen={isDialogOpen}
        title="アンケート"
        message="この物体がある場所は直感に合っていますか？&#10;&#10;直感に合っていて階層構造の修正が必要ない場合は「はい」を、&#10;直感に合っておらず階層構造の修正が必要な場合は「いいえ」を選択してください。"
        imageUrl={selectedImageUrl}
        folderImages={folderImagesList}
        imageFolderPath={currentFolderPath}
        onYes={handleDialogYes}
        onNo={handleDialogNo}
      />
    </>
  );
};

export default ProjectDetail;
