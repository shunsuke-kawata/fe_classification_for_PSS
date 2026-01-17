import "./styles.modules.css";
import { useState } from "react";
import {
  treeNode,
  getImageCountInFolder,
  isLeaf,
  getFolderName,
} from "@/utils/result";
import {
  createFolder,
  renameFolderOrFile,
  deleteEmptyFolders,
} from "@/api/api";

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

  // コンテキストメニューの状態管理
  const [contextMenuOpen, setContextMenuOpen] = useState<boolean>(false);

  // 編集モードの状態管理
  const [isEditingMode, setIsEditingMode] = useState<boolean>(false);
  const [editingName, setEditingName] = useState<string>("");

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

  // コンテキストメニューの開閉
  const handleContextMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setContextMenuOpen(!contextMenuOpen);
  };

  // 名前変更の開始
  const handleRenameStart = () => {
    console.log("フォルダ名変更開始:", currentFolder);
    setContextMenuOpen(false);
    setIsEditingMode(true);
    setEditingName(currentFolderName);
  };

  // 名前変更の確定
  const handleNameChangeConfirm = async () => {
    console.log("=== 名前変更確定 ===");
    console.log("mongo_result_id:", mongo_result_id);
    console.log("folder node_id:", currentFolder);
    console.log("新しい名前:", editingName);

    if (!mongo_result_id) {
      console.error("mongo_result_id が設定されていません");
      alert("名前変更に失敗しました：mongo_result_id が設定されていません");
      return;
    }

    if (!editingName.trim()) {
      console.error("新しい名前が空です");
      alert("名前を入力してください");
      return;
    }

    try {
      console.log(`名前変更API呼び出し: ${currentFolder} -> ${editingName}`);

      const response = await renameFolderOrFile(
        mongo_result_id,
        currentFolder,
        editingName.trim(),
        currentFolderIsLeaf
      );

      console.log("名前変更API応答:", response);

      if (response && response.message === "success") {
        console.log(
          `✅ 「${currentFolder}」の名前を「${editingName}」に変更しました`
        );
        window.location.reload();
      } else {
        const errorMessage = response?.message || "名前変更に失敗しました";
        console.error("名前変更失敗:", errorMessage);
        alert(`名前変更に失敗しました: ${errorMessage}`);
      }
    } catch (error) {
      console.error("名前変更エラー:", error);
      const apiError = (error as any)?.response;
      let errorMessage = "不明なエラーが発生しました";

      if (apiError) {
        errorMessage =
          apiError.data?.message ||
          apiError.statusText ||
          `HTTP ${apiError.status} エラー`;
      } else if ((error as any)?.message) {
        errorMessage = (error as any).message;
      }

      alert(`名前変更に失敗しました: ${errorMessage}`);
    } finally {
      setIsEditingMode(false);
      setEditingName("");
    }
  };

  // 名前変更のキャンセル
  const handleNameChangeCancel = () => {
    console.log("名前変更キャンセル");
    setIsEditingMode(false);
    setEditingName("");
  };

  // フォルダの削除
  const handleDeleteFolder = async () => {
    console.log("Delete folder:", currentFolder);
    setContextMenuOpen(false);

    if (!mongo_result_id) {
      console.error("mongo_result_id が設定されていません");
      alert("削除に失敗しました：mongo_result_id が設定されていません");
      return;
    }

    try {
      console.log(`フォルダ削除API呼び出し: ${currentFolder}`);
      const response = await deleteEmptyFolders(mongo_result_id, [
        currentFolder,
      ]);

      console.log("削除API応答:", response);

      if (response && response.message === "success") {
        console.log(`✅ フォルダ「${currentFolder}」を削除しました`);
        window.location.reload();
      } else {
        const errorMessage = response?.message || "削除に失敗しました";
        console.error("フォルダ削除失敗:", errorMessage);
        alert(`フォルダ削除に失敗しました: ${errorMessage}`);
      }
    } catch (error) {
      console.error("フォルダ削除エラー:", error);
      const apiError = (error as any)?.response;
      let errorMessage = "不明なエラーが発生しました";

      if (apiError) {
        errorMessage =
          apiError.data?.message ||
          apiError.statusText ||
          `HTTP ${apiError.status} エラー`;
      } else if ((error as any)?.message) {
        errorMessage = (error as any).message;
      }

      alert(`フォルダ削除に失敗しました: ${errorMessage}`);
    }
  };

  // フォルダ名の表示判定（20文字以上の場合は非表示）
  const currentFolderName = currentFolder
    ? getFolderName(result, currentFolder)
    : "Root";
  const shouldShowFolderName =
    !isCreateMode && !isEditingMode && currentFolderName.length < 20;

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
            {/* 3点リーダーボタン */}
            <button
              className="context-menu-button-breadcrumb"
              onClick={handleContextMenuClick}
            >
              ⋮
            </button>
            {/* コンテキストメニュー */}
            {contextMenuOpen && (
              <div className="context-menu-breadcrumb">
                <button onClick={handleRenameStart}>名前の変更</button>
                <button onClick={handleDeleteFolder}>削除</button>
              </div>
            )}
          </span>
        )}
        {/* 編集モード */}
        {isEditingMode && (
          <div className="folder-name-edit-container-breadcrumb">
            <input
              type="text"
              className="folder-name-input-breadcrumb"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleNameChangeConfirm();
                } else if (e.key === "Escape") {
                  handleNameChangeCancel();
                }
              }}
              autoFocus
            />
            <div className="folder-name-edit-buttons-breadcrumb">
              <button className="confirm-btn" onClick={handleNameChangeConfirm}>
                ✓
              </button>
              <button
                className="cancel-edit-btn"
                onClick={handleNameChangeCancel}
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="breadcrumbs-right">
        {!isCreateMode ? (
          // 通常モード: フォルダ作成ボタンを表示（リーフフォルダでは非表示）
          !currentFolderIsLeaf && (
            <button
              className="create-folder-btn"
              onClick={handleCreateModeToggle}
            >
              フォルダ作成
            </button>
          )
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
