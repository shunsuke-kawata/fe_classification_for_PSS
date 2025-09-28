import "./styles.modules.css";
import {
  treeNode,
  getImageCountInFolder,
  isLeaf as isLeafFunction,
} from "@/utils/result";

interface listViewProps {
  isLeaf: boolean;
  folders: string[];
  setSelectedFolder: React.Dispatch<React.SetStateAction<string>>;
  result: {
    [topLevelNodeId: string]: treeNode;
  };
}
const ListView: React.FC<listViewProps> = ({
  isLeaf,
  folders,
  setSelectedFolder,
  result,
}: listViewProps) => {
  return (
    <div className="list-view-main">
      {folders.map((foldername, idx) => {
        // 各フォルダがis_leafかどうかをチェック
        const folderIsLeaf = isLeafFunction(result, foldername);
        // is_leafのフォルダの画像枚数を取得
        const imageCount = folderIsLeaf
          ? getImageCountInFolder(result, foldername)
          : 0;

        return (
          <div
            key={idx}
            className={`list-view-item ${
              idx % 2 === 0 ? "list-view-item-even" : "list-view-item-odd"
            }`}
            onClick={isLeaf ? () => {} : () => setSelectedFolder(foldername)}
          >
            {isLeaf ? <></> : <span className="arrow">{"＞"}</span>}
            <img
              className="img-icon"
              src={
                isLeaf
                  ? "/assets/image-file-icon.svg"
                  : "/assets/folder-icon.svg"
              }
              alt=""
            />
            <span className="folder-name-span">
              {foldername}
              {folderIsLeaf && imageCount > 0 && (
                <span className="image-count">({imageCount})</span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default ListView;
