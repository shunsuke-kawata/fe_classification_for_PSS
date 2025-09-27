import { useEffect, useState } from "react";
import "./styles.modules.css";
import { clusteringStatus } from "@/config";
import { getClusteringResult } from "@/api/api";
import DndFinder from "./DndFinder/DndFinder";
import { treeNode } from "@/utils/result";

type reclassificationInterfaceProps = {
  mongoResultId: string;
  initClusteringState: number;
  originalImageFolderPath: string;
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
}) => {
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
        console.log("=== ReclassificationInterface: データ取得開始 ===");
        console.log("mongo_result_id:", mongo_result_id);
        console.log("originalImageFolderPath:", originalImageFolderPath);

        const resultRes = await getClusteringResult(mongo_result_id);

        console.log("=== ReclassificationInterface: データ取得完了 ===");
        console.log("取得したデータ:", resultRes);

        console.log("=== データ検証 ===");
        console.log("resultRes:", resultRes);
        console.log("resultRes type:", typeof resultRes);
        console.log("resultRes is null:", resultRes === null);
        console.log("resultRes is undefined:", resultRes === undefined);

        if (resultRes && typeof resultRes === "object") {
          console.log("resultRes keys:", Object.keys(resultRes));
          console.log("resultRes.result:", resultRes.result);
          console.log("resultRes.result type:", typeof resultRes.result);

          if (resultRes.result) {
            setClusteringResult(resultRes);
            console.log("✅ データ設定完了");
          } else {
            console.error("❌ resultRes.result が存在しません");
            setError("データの取得に失敗しました: result field not found");
          }
        } else {
          console.error("❌ データが不正です:", resultRes);
          setError("データの取得に失敗しました: invalid data format");
        }
      } catch (error) {
        console.error("=== ReclassificationInterface: データ取得エラー ===");
        console.error("Error:", error);
        setError("データの取得中にエラーが発生しました");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClusteringResult(mongoResultId);
  }, [mongoResultId, initClusteringState, originalImageFolderPath]);

  useEffect(() => {
    console.log("=== ReclassificationInterface: 状態更新 ===");
    console.log("clusteringResult:", clusteringResult);
    console.log("isLoading:", isLoading);
    console.log("error:", error);
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
          />
          {/* 移動後を表示するFinderUI */}
          <DndFinder
            finderType="after"
            result={clusteringResult.result}
            originalImageFolderPath={originalImageFolderPath}
            mongo_result_id={mongoResultId}
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
