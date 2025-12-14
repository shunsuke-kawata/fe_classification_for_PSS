import "./styles.modules.css";
import { useState } from "react";
import {
  treeNode,
  getImageCountInFolder,
  isLeaf,
  getFolderName,
} from "@/utils/result";
import { createFolder } from "@/api/api";

interface dndBreadcrumbsProps {
  parentFolders: string[];
  setSelectedFolder: React.Dispatch<React.SetStateAction<string>>;
  topLevelId?: string;
  result: {
    [topLevelNodeId: string]: treeNode;
  };
  mongo_result_id: string;
  onFolderMoveComplete?: (source: string, destination: string) => Promise<void>;
}

const DndBreadcrumbs: React.FC<dndBreadcrumbsProps> = ({
  parentFolders,
  setSelectedFolder,
  topLevelId,
  result,
  mongo_result_id,
  onFolderMoveComplete,
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
  const handleCreateCategory = async () => {
    try {
      console.log("📁 カテゴリフォルダ作成開始:");
      console.log(`   親フォルダID: ${currentFolder}`);

      const response = await createFolder(
        mongo_result_id,
        currentFolder,
        false // is_leaf = false (カテゴリフォルダ)
      );

      console.log("📋 フォルダ作成API Response:", response);

      if (response && response.message === "success") {
        console.log("✅ カテゴリフォルダ作成成功");
        alert("カテゴリフォルダを作成しました");

        setIsCreateMode(false);

        // データをリロード
        if (onFolderMoveComplete) {
          await onFolderMoveComplete(currentFolder, currentFolder);
        }

        console.log("♻️ フォルダ作成完了 - ページリロード実行中...");
        window.location.reload();
      } else {
        console.error(
          "❌ フォルダ作成に失敗しました:",
          response?.message || "不明なエラー"
        );
        alert(
          `フォルダ作成に失敗しました: ${response?.message || "不明なエラー"}`
        );
      }
    } catch (error) {
      console.error("❌ フォルダ作成エラー:", error);
      const errorMessage =
        (error as any)?.response?.data?.message ||
        (error as any)?.message ||
        "不明なエラーが発生しました";
      alert(`フォルダ作成に失敗しました: ${errorMessage}`);
    }
  };

  // ファイル作成（is_leaf=true）
  const handleCreateFile = async () => {
    try {
      console.log("📁 ファイルフォルダ作成開始:");
      console.log(`   親フォルダID: ${currentFolder}`);

      const response = await createFolder(
        mongo_result_id,
        currentFolder,
        true // is_leaf = true (ファイルフォルダ)
      );

      console.log("📋 フォルダ作成API Response:", response);

      if (response && response.message === "success") {
        console.log("✅ ファイルフォルダ作成成功");
        alert("ファイルフォルダを作成しました");

        setIsCreateMode(false);

        // データをリロード
        if (onFolderMoveComplete) {
          await onFolderMoveComplete(currentFolder, currentFolder);
        }

        console.log("♻️ フォルダ作成完了 - ページリロード実行中...");
        window.location.reload();
      } else {
        console.error(
          "❌ フォルダ作成に失敗しました:",
          response?.message || "不明なエラー"
        );
        alert(
          `フォルダ作成に失敗しました: ${response?.message || "不明なエラー"}`
        );
      }
    } catch (error) {
      console.error("❌ フォルダ作成エラー:", error);
      const errorMessage =
        (error as any)?.response?.data?.message ||
        (error as any)?.message ||
        "不明なエラーが発生しました";
      alert(`フォルダ作成に失敗しました: ${errorMessage}`);
    }
  };

  // キャンセル
  const handleCancel = () => {
    setIsCreateMode(false);
  };

  // フォルダ名の表示判定（20文字以上の場合は非表示）
  const currentFolderName = currentFolder
    ? getFolderName(result, currentFolder)
    : "Root";
  const shouldShowFolderName = !isCreateMode && currentFolderName.length < 20;

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
        {shouldShowFolderName && (
          <span className="breadcrumb-item">
            {currentFolderName}
            {currentFolderIsLeaf && imageCount > 0 && (
              <span className="image-count">({imageCount})</span>
            )}
          </span>
        )}
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
              リーフ
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
