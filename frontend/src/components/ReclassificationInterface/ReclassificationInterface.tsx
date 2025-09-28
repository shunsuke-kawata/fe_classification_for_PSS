import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import "./styles.modules.css";
import { clusteringStatus } from "@/config";
import { getClusteringResult } from "@/api/api";
import DndFinder from "./DndFinder/DndFinder";
import { treeNode, getTopLevelFolderId } from "@/utils/result";

type reclassificationInterfaceProps = {
  mongoResultId: string;
  initClusteringState: number;
  originalImageFolderPath: string;
  onFolderMoveComplete?: (
    targetFolder: string,
    destinationFolder: string
  ) => void;
  onFolderChange?: (beforeFolderId: string, afterFolderId: string) => void;
};

// 最上位のレスポンス全体
interface clusteringResultType {
  _id: string;
  mongo_result_id: string;
  result: {
    [topLevelNodeId: string]: treeNode;
  };
}

const ReclassificationInterface: React.FC<reclassificationInterfaceProps> = ({
  mongoResultId,
  initClusteringState,
  originalImageFolderPath,
  onFolderMoveComplete,
  onFolderChange,
}) => {
  const [clusteringResult, setClusteringResult] =
    useState<clusteringResultType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [currentBeforeFolderId, setCurrentBeforeFolderId] =
    useState<string>("");
  const [currentAfterFolderId, setCurrentAfterFolderId] = useState<string>("");
  const searchParams = useSearchParams();

  // フォルダ移動パラメータを取得
  const targetFolder = searchParams.get("t_folder");
  const destinationFolder = searchParams.get("d_folder");

  // データをリフレッシュする関数
  const refreshClusteringResult = async () => {
    if (initClusteringState !== clusteringStatus.Finished) return;

    setIsLoading(true);
    setError(null);

    try {
      const resultRes = await getClusteringResult(mongoResultId);

      if (resultRes && typeof resultRes === "object") {
        if (resultRes.result) {
          setClusteringResult(resultRes);
        } else {
          setError("データの取得に失敗しました: result field not found");
        }
      } else {
        setError("データの取得に失敗しました: invalid data format");
      }
    } catch (error) {
      setError("データの取得中にエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  // フォルダ移動完了時の処理
  const handleFolderMoveComplete = async (
    targetFolderId: string,
    destinationFolderId: string
  ) => {
    // データをリフレッシュ
    await refreshClusteringResult();

    // 親コンポーネントにリダイレクトを通知
    if (onFolderMoveComplete) {
      onFolderMoveComplete(targetFolderId, destinationFolderId);
    }
  };

  // フォルダ変更時の処理（before/afterのフォルダ選択が変更された時）
  const handleBeforeFolderChange = useCallback(
    (folderId: string) => {
      setCurrentBeforeFolderId(folderId);
      if (onFolderChange) {
        onFolderChange(folderId, currentAfterFolderId);
      }
    },
    [onFolderChange, currentAfterFolderId]
  );

  const handleAfterFolderChange = useCallback(
    (folderId: string) => {
      setCurrentAfterFolderId(folderId);
      if (onFolderChange) {
        onFolderChange(currentBeforeFolderId, folderId);
      }
    },
    [onFolderChange, currentBeforeFolderId]
  );

  useEffect(() => {
    if (initClusteringState !== clusteringStatus.Finished) return;

    const fetchClusteringResult = async (mongo_result_id: string) => {
      await refreshClusteringResult();
    };

    fetchClusteringResult(mongoResultId);
  }, [
    mongoResultId,
    initClusteringState,
    originalImageFolderPath,
    refreshTrigger,
  ]);

  // クエリパラメータからフォルダIDを初期設定
  useEffect(() => {
    if (targetFolder) {
      setCurrentBeforeFolderId(targetFolder);
    }
    if (destinationFolder) {
      setCurrentAfterFolderId(destinationFolder);
    }
  }, [targetFolder, destinationFolder]);

  // クラスタリング結果が読み込まれた際の初期化処理
  useEffect(() => {
    if (clusteringResult && clusteringResult.result) {
      const topLevelId = getTopLevelFolderId(clusteringResult.result);

      // 初回アクセス時（パラメータが未設定）の場合、topLevelIdで初期化
      if (topLevelId) {
        if (!targetFolder && !currentBeforeFolderId) {
          setCurrentBeforeFolderId(topLevelId);
        }
        if (!destinationFolder && !currentAfterFolderId) {
          setCurrentAfterFolderId(topLevelId);
        }
      }
    }
  }, [
    clusteringResult,
    targetFolder,
    destinationFolder,
    currentBeforeFolderId,
    currentAfterFolderId,
  ]);

  useEffect(() => {
    // 状態更新の監視（デバッグ用のログを削除）
  }, [clusteringResult, isLoading, error]);

  if (isLoading) {
    return (
      <div className="dnd-interface-div-main">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            fontSize: "18px",
            color: "#666",
          }}
        >
          データを読み込み中...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dnd-interface-div-main">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            fontSize: "18px",
            color: "#e74c3c",
          }}
        >
          エラー: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="dnd-interface-div-main">
      {clusteringResult?.result ? (
        <>
          {/* 移動前を表示するFinderUI */}
          <DndFinder
            finderType="before"
            result={clusteringResult.result}
            originalImageFolderPath={originalImageFolderPath}
            mongo_result_id={mongoResultId}
            onFolderMoveComplete={handleFolderMoveComplete}
            onFolderChange={handleBeforeFolderChange}
            targetFolder={targetFolder}
            destinationFolder={destinationFolder}
          />
          {/* 移動後を表示するFinderUI */}
          <DndFinder
            finderType="after"
            result={clusteringResult.result}
            originalImageFolderPath={originalImageFolderPath}
            mongo_result_id={mongoResultId}
            onFolderMoveComplete={handleFolderMoveComplete}
            onFolderChange={handleAfterFolderChange}
            targetFolder={targetFolder}
            destinationFolder={destinationFolder}
          />
        </>
      ) : (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            fontSize: "18px",
            color: "#666",
          }}
        >
          データがありません
        </div>
      )}
    </div>
  );
};

export default ReclassificationInterface;
