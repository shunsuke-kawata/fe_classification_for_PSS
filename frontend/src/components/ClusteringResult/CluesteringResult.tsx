import { clusteringStatus } from "@/config";
import { getinitClusteringResult } from "@/api/api";
import { useEffect, useState } from "react";
import Finder from "./Finder/Finder";
import "./styles.modules.css";
type clusteringResultProps = {
  mongoResultId: string;
  initClusteringState: number;
};

type leafData = { [imageId: string]: string };
interface treeNode {
  is_leaf: boolean;
  data: treeData;
}

type treeData = leafData | { [nodeId: string]: treeNode };
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
}: clusteringResultProps) => {
  const [clusteringResult, setClusteringResult] =
    useState<clusteringResultType | null>(null);
  useEffect(() => {
    if (initClusteringState !== clusteringStatus.Finished) return;
    const fetchClusteringResult = async (mongo_result_id: string) => {
      try {
        const resultRes = await getinitClusteringResult(mongo_result_id);
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
          <Finder result={clusteringResult.result} />
        )}
      </div>
    </>
  );
};

export default ClusteringResult;
