import { clusteringStatus } from "@/config";
import { getClusteringResult } from "@/api/api";
import { useEffect, useState } from "react";
import Finder from "./Finder/Finder";
import "./styles.modules.css";
import { treeNode } from "@/utils/result";

type clusteringResultProps = {
  mongoResultId: string;
  initClusteringState: number;
  originalImageFolderPath: string;
  currentFolder?: string | null;
  onCurrentFolderChange?: (currentFolderId: string) => void;
};

interface clusteringResultType {
  _id: string;
  mongo_result_id: string;
  result: treeNode;
}

const ClusteringResult: React.FC<clusteringResultProps> = ({
  mongoResultId,
  initClusteringState,
  originalImageFolderPath,
  currentFolder,
  onCurrentFolderChange,
}: clusteringResultProps) => {
  const [clusteringResult, setClusteringResult] =
    useState<clusteringResultType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initClusteringState !== clusteringStatus.Finished) return;

    const fetchClusteringResult = async (mongo_result_id: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const resultRes = await getClusteringResult(mongo_result_id);

        if (resultRes && typeof resultRes === "object") {
          if (resultRes.result) {
            setClusteringResult(resultRes);
          } else {
            console.error("❌ resultRes.result が存在しません");
            setError("データの取得に失敗しました: result field not found");
          }
        } else {
          console.error("❌ データが不正です:", resultRes);
          setError("データの取得に失敗しました: invalid data format");
        }
      } catch (error) {
        console.error("=== ClusteringResult: データ取得エラー ===");
        console.error("Error:", error);
        setError("データの取得中にエラーが発生しました");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClusteringResult(mongoResultId);
  }, [mongoResultId, initClusteringState]);

  useEffect(() => {
    // 状態更新の監視（デバッグ用のログを削除）
  }, [clusteringResult, isLoading, error]);

  if (isLoading) {
    return (
      <div className="result-div-main">
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
      <div className="result-div-main">
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
    <>
      <div className="result-div-main">
        {clusteringResult?.result ? (
          <Finder
            result={
              clusteringResult.result as unknown as {
                [topLevelNodeId: string]: treeNode;
              }
            }
            originalImageFolderPath={originalImageFolderPath}
            currentFolder={currentFolder}
            onCurrentFolderChange={onCurrentFolderChange}
            mongo_result_id={mongoResultId}
          />
        ) : (
          <div className="no-data-display">データがありません</div>
        )}
      </div>
    </>
  );
};

export default ClusteringResult;
