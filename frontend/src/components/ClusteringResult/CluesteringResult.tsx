import { clusteringStatus } from "@/config";
import { getClusteringResult } from "@/api/api";
import { useEffect, useState } from "react";
import Finder from "./Finder/Finder";
import "./styles.modules.css";

type clusteringResultProps = {
  mongoResultId: string;
  initClusteringState: number;
  originalImageFolderPath: string;
};

export type leafData = { [imageId: string]: string };
export interface treeNode {
  is_leaf: boolean;
  data: treeData;
}

export type treeData = leafData | { [nodeId: string]: treeNode };
// 最上位のレスポンス全体
interface clusteringResultType {
  _id: string;
  mongo_result_id: string;
  result: {
    [topLevelNodeId: string]: treeNode;
  };
}

const ClusteringResult: React.FC<clusteringResultProps> = ({
  mongoResultId,
  initClusteringState,
  originalImageFolderPath,
}: clusteringResultProps) => {
  const [clusteringResult, setClusteringResult] =
    useState<clusteringResultType | null>(null);
  useEffect(() => {
    if (initClusteringState !== clusteringStatus.Finished) return;
    const fetchClusteringResult = async (mongo_result_id: string) => {
      try {
        const resultRes = await getClusteringResult(mongo_result_id);
        return resultRes;
      } catch (error) {
        console.log(error);
      }
    };

    fetchClusteringResult(mongoResultId).then((res) => {
      if (res) {
        setClusteringResult(res);
      }
    });
  }, []);

  useEffect(() => {
    console.log(clusteringResult);
  }, [clusteringResult]);

  return (
    <>
      <div className="result-div-main">
        {clusteringResult?.result && (
          <Finder
            result={clusteringResult.result}
            originalImageFolderPath={originalImageFolderPath}
          />
        )}
      </div>
    </>
  );
};

export default ClusteringResult;
