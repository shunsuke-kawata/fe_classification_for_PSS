import "./styles.modules.css";
import {
  treeNode,
  getImageCountInFolder,
  isLeaf,
  getFolderName,
} from "@/utils/result";

interface dndBreadcrumbsProps {
  parentFolders: string[];
  setSelectedFolder: React.Dispatch<React.SetStateAction<string>>;
  topLevelId?: string;
  result: {
    [topLevelNodeId: string]: treeNode;
  };
}

const DndBreadcrumbs: React.FC<dndBreadcrumbsProps> = ({
  parentFolders,
  setSelectedFolder,
  topLevelId,
  result,
}) => {
  const items = parentFolders;

  // 現在のフォルダの画像枚数を取得
  const currentFolder =
    items.length === 0 ? topLevelId || "Root" : items[items.length - 1];
  const currentFolderIsLeaf = currentFolder
    ? isLeaf(result, currentFolder)
    : false;
  const imageCount = currentFolderIsLeaf
    ? getImageCountInFolder(result, currentFolder)
    : 0;

  const toParentFolder = () => {
    if (items.length === 0) {
      return;
    } else if (items.length === 1) {
      if (topLevelId) {
        setSelectedFolder(topLevelId);
      }
    } else {
      setSelectedFolder(items[items.length - 2]);
    }
  };

  return (
    <div className="breadcrumbs">
      <div className="parent-folder-button" onClick={() => toParentFolder()}>
        <span
          className={
            items.length === 0 ? "parent-folder-button-span-disabled" : ""
          }
        >
          ..
        </span>
      </div>
      <span className="breadcrumb-item">
        {currentFolder ? getFolderName(result, currentFolder) : "Root"}
        {currentFolderIsLeaf && imageCount > 0 && (
          <span className="image-count">({imageCount})</span>
        )}
      </span>
    </div>
  );
};

export default DndBreadcrumbs;
