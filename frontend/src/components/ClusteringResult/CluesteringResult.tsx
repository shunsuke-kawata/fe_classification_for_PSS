import { clusteringStatus } from "@/config";
type clusteringResultProps = {
  initClusteringState: number;
};
const ClusteringResult: React.FC<clusteringResultProps> = ({
  initClusteringState,
}: clusteringResultProps) => {
  console.log(initClusteringState);
  return <></>;
};

export default ClusteringResult;
