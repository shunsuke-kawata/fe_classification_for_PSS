import { clusteringStatus } from "@/config";
import { getClusteringResult, getClusteringCounts } from "@/api/api";
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
  projectId: number;
  userId: number;
  selectedClusteringCount?: number | null;
  imageClusteringCounts?: { [clustering_id: string]: number };
  isMeasuring?: boolean;
  onFolderClick?: (
    folderId: string,
    currentFolderId: string,
    source: "breadcrumb" | "list",
    isUpNavigation?: boolean,
  ) => void;
  onLeafFolderOpen?: (folderId?: string) => void;
  onScroll?: (scrollTop: number) => void;
  selectedAlphabet?: string;
  onAlphabetChange?: (alphabet: string) => void;
  selectedFileName?: string | null;
  onFileNamesAvailable?: (fileNames: string[]) => void;
  onImageClickForMeasurement?: () => void;
  onFolderImagesUpdate?: (images: string[]) => void;
  onCurrentFolderPathUpdate?: (path: string) => void;
};

interface clusteringResultType {
  _id: string;
  mongo_result_id: string;
  result: treeNode;
}

interface ClusteringCountsData {
  available_counts: number[];
  image_counts: { [clustering_id: string]: number };
}

const ClusteringResult: React.FC<clusteringResultProps> = ({
  mongoResultId,
  initClusteringState,
  originalImageFolderPath,
  currentFolder,
  onCurrentFolderChange,
  projectId,
  userId,
  selectedClusteringCount,
  imageClusteringCounts,
  isMeasuring,
  onFolderClick,
  onLeafFolderOpen,
  onScroll,
  selectedAlphabet,
  onAlphabetChange,
  selectedFileName,
  onFileNamesAvailable,
  onImageClickForMeasurement,
  onFolderImagesUpdate,
  onCurrentFolderPathUpdate,
}: clusteringResultProps) => {
  const [clusteringResult, setClusteringResult] =
    useState<clusteringResultType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 外部から渡されるクラスタリング回数フィルタ (page.tsxから制御される)
  const selectedCount =
    typeof selectedClusteringCount !== "undefined"
      ? selectedClusteringCount
      : null;

  useEffect(() => {
    if (initClusteringState !== clusteringStatus.Finished) return;

    const fetchClusteringResult = async (mongo_result_id: string) => {
      console.log("🔍 ClusteringResult: データ取得開始");
      console.log("  - mongo_result_id:", mongo_result_id);
      console.log("  - initClusteringState:", initClusteringState);

      setIsLoading(true);
      setError(null);

      try {
        const resultRes = await getClusteringResult(mongo_result_id);

        console.log("🔍 ClusteringResult: API レスポンス受信");
        console.log("  - resultRes type:", typeof resultRes);
        console.log("  - resultRes is null:", resultRes === null);
        console.log("  - resultRes is undefined:", resultRes === undefined);

        if (resultRes && typeof resultRes === "object") {
          console.log("  - resultRes keys:", Object.keys(resultRes));
          console.log("  - resultRes.result exists:", !!resultRes.result);
          console.log(
            "  - resultRes.all_nodes exists:",
            !!(resultRes as any).all_nodes,
          );

          if (resultRes.result) {
            console.log("  - resultRes.result type:", typeof resultRes.result);
            console.log(
              "  - resultRes.result keys count:",
              Object.keys(resultRes.result).length,
            );
            console.log("✅ ClusteringResult: データ取得成功");
            setClusteringResult(resultRes);
          } else {
            console.error("❌ resultRes.result が存在しません");
            console.error(
              "  - resultRes 全体:",
              JSON.stringify(resultRes, null, 2),
            );
            setError("データの取得に失敗しました: result field not found");
          }
        } else {
          console.error("❌ データが不正です:", resultRes);
          setError("データの取得に失敗しました: invalid data format");
        }
      } catch (error) {
        console.error("=== ClusteringResult: データ取得エラー ===");
        console.error("Error:", error);
        console.error("Error type:", typeof error);
        if (error instanceof Error) {
          console.error("Error message:", error.message);
          console.error("Error stack:", error.stack);
        }
        setError("データの取得中にエラーが発生しました");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClusteringResult(mongoResultId);
  }, [mongoResultId, initClusteringState]);

  // クラスタリング回数は親コンポーネントから渡されるため、ここでは取得処理を行いません

  useEffect(() => {
    // 状態更新の監視（デバッグ用のログを削除）
  }, [clusteringResult, isLoading, error]);

  // プルダウンの表示ラベルを取得（親から渡された値表示用）
  const getCountLabel = (count: number | null) => {
    if (count === null) return "全て";
    if (count === 0) return "初期分類";
    return `第${count}回`;
  };

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
        {/* クラスタリング回数フィルタは親コンポーネント(page.tsx)で表示されるためここではUIを表示しない */}

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
            selectedClusteringCount={selectedCount}
            imageClusteringCounts={imageClusteringCounts || {}}
            isMeasuring={isMeasuring}
            onFolderClick={onFolderClick}
            onLeafFolderOpen={onLeafFolderOpen}
            onScroll={onScroll}
            selectedAlphabet={selectedAlphabet}
            onAlphabetChange={onAlphabetChange}
            selectedFileName={selectedFileName}
            onFileNamesAvailable={onFileNamesAvailable}
            onImageClickForMeasurement={onImageClickForMeasurement}
            onFolderImagesUpdate={onFolderImagesUpdate}
            onCurrentFolderPathUpdate={onCurrentFolderPathUpdate}
          />
        ) : (
          <div className="no-data-display">データがありません</div>
        )}
      </div>
    </>
  );
};

export default ClusteringResult;
