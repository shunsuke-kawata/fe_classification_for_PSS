import { useEffect, useState } from "react";
import "./styles.modules.css";
import { clusteringStatus } from "@/config";
import { getClusteringResult } from "@/api/api";
import DndFinder from "./DndFinder/DndFinder";

type reclassificationInterfaceProps = {
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
  useEffect(() => {
    if (initClusteringState !== clusteringStatus.Finished) return;
    console.log(originalImageFolderPath);
    const fetchClusteringResult = async (mongo_result_id: string) => {
      try {
        const resultRes = await getClusteringResult(mongo_result_id);
        console.log(resultRes);
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
    <div className="dnd-interface-div-main">
      <></>
      {clusteringResult?.result && (
        <>
          <DndFinder
            result={clusteringResult.result}
            originalImageFolderPath={originalImageFolderPath}
          />
          <DndFinder
            result={clusteringResult.result}
            originalImageFolderPath={originalImageFolderPath}
          />
        </>
      )}
    </div>
  );
};

export default ReclassificationInterface;
