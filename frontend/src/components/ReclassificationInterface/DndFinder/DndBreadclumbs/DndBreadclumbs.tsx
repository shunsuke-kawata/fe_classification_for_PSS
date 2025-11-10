import "./styles.modules.css";
import { useState } from "react";
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

  // フォルダ作成モードの状態管理
  const [isCreateMode, setIsCreateMode] = useState<boolean>(false);

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

  // フォルダ作成モードの切り替え
  const handleCreateModeToggle = () => {
    setIsCreateMode(!isCreateMode);
  };

  // カテゴリ作成（is_leaf=false）
  const handleCreateCategory = () => {
    console.log("カテゴリ作成: is_leaf=false");
    // TODO: API呼び出し処理を実装
    setIsCreateMode(false);
  };

  // ファイル作成（is_leaf=true）
  const handleCreateFile = () => {
    console.log("ファイル作成: is_leaf=true");
    // TODO: API呼び出し処理を実装
    setIsCreateMode(false);
  };

  // キャンセル
  const handleCancel = () => {
    setIsCreateMode(false);
  };

  return (
    <div className="dnd-breadcrumbs">
      <div className="breadcrumbs-left">
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

      <div className="breadcrumbs-right">
        {!isCreateMode ? (
          // 通常モード: フォルダ作成ボタンを表示
          <button
            className="create-folder-btn"
            onClick={handleCreateModeToggle}
          >
            フォルダ作成
          </button>
        ) : (
          // 作成モード: カテゴリ、ファイル、キャンセルボタンを表示
          <div className="create-mode-buttons">
            <button
              className="create-category-btn"
              onClick={handleCreateCategory}
            >
              カテゴリ
            </button>
            <button className="create-file-btn" onClick={handleCreateFile}>
              ファイル
            </button>
            <button className="cancel-btn" onClick={handleCancel}>
              キャンセル
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DndBreadcrumbs;
