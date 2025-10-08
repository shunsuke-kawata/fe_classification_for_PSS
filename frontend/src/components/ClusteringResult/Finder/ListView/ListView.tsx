import "./styles.modules.css";
import {
  treeNode,
  getImageCountInFolder,
  isLeaf as isLeafFunction,
  findNodeById,
  getFolderName,
} from "@/utils/result";
import { useState, useEffect } from "react";
import { deleteEmptyFolders } from "@/api/api";

interface listViewProps {
  isLeaf: boolean;
  folders: string[];
  setSelectedFolder: React.Dispatch<React.SetStateAction<string>>;
  result: {
    [topLevelNodeId: string]: treeNode;
  };
  onImageSelect?: (imagePath: string) => void;
  selectedImagePath?: string;
  mongo_result_id?: string;
}
const ListView: React.FC<listViewProps> = ({
  isLeaf,
  folders,
  setSelectedFolder,
  result,
  onImageSelect,
  selectedImagePath,
  mongo_result_id,
}: listViewProps) => {
  // コンテキストメニューの状態管理
  const [contextMenuIndex, setContextMenuIndex] = useState<number | null>(null);

  // コンテキストメニューのハンドラー
  const handleContextMenuClick = (index: number) => {
    setContextMenuIndex(contextMenuIndex === index ? null : index);
  };

  const handleRenameFolder = (folderName: string) => {
    console.log("フォルダ名変更:", folderName);
    setContextMenuIndex(null);
  };

  const handleDeleteFolder = async (folderName: string) => {
    console.log("フォルダ削除:", folderName);
    setContextMenuIndex(null);

    // mongo_result_idが存在するかチェック
    if (!mongo_result_id) {
      console.error("mongo_result_id が設定されていません");
      alert("削除に失敗しました：mongo_result_id が設定されていません");
      return;
    }

    try {
      console.log(`フォルダ削除API呼び出し: ${folderName}`);
      const response = await deleteEmptyFolders(mongo_result_id, [folderName]);

      console.log("削除API応答:", response);

      // 成功レスポンスの判定：message が "success" かどうかで判定
      if (response && response.message === "success") {
        console.log(`✅ フォルダ「${folderName}」を削除しました`);
        alert(`フォルダ「${folderName}」を削除しました`);

        // ページをリロードして最新状態を反映
        window.location.reload();
      } else {
        // エラーレスポンスの場合
        const errorMessage = response?.message || "削除に失敗しました";
        console.error("フォルダ削除失敗:", errorMessage);
        alert(`フォルダ削除に失敗しました: ${errorMessage}`);
      }
    } catch (error) {
      console.error("フォルダ削除エラー:", error);

      // APIエラーの詳細を取得
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
  }; // コンテキストメニューを閉じるためのクリックハンドラー
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenuIndex(null);
    };

    if (contextMenuIndex !== null) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [contextMenuIndex]);

  // 空フォルダかどうかを判定する関数
  const isFolderEmpty = (folderName: string): boolean => {
    const node = findNodeById(result, folderName);
    if (!node || !node.data) {
      return true; // ノードが見つからない、またはdataがない場合は空と判定
    }
    return Object.keys(node.data).length === 0;
  };

  return (
    <div className="list-view-main">
      {folders.map((foldername, idx) => {
        // 各フォルダがis_leafかどうかをチェック
        const folderIsLeaf = isLeafFunction(result, foldername);
        // is_leafのフォルダの画像枚数を取得
        const imageCount = folderIsLeaf
          ? getImageCountInFolder(result, foldername)
          : 0;

        // フォルダが空かどうかを判定
        const isEmpty = isFolderEmpty(foldername);

        // 画像が選択されているかチェック（is_leafの場合のみ）
        const isSelected = isLeaf && selectedImagePath === foldername;

        return (
          <div
            key={idx}
            className={`list-view-item ${
              idx % 2 === 0 ? "list-view-item-even" : "list-view-item-odd"
            } ${isSelected ? "selected" : ""}`}
            onClick={() => {
              console.log("=== ListViewアイテムがクリックされました ===");
              console.log("ファイル名:", foldername);
              console.log("isLeaf:", isLeaf);
              console.log("folderIsLeaf:", folderIsLeaf);
              console.log("onImageSelect存在:", !!onImageSelect);

              if (isLeaf) {
                // is_leafフォルダ内では、すべてのアイテムを画像として扱う
                console.log("is_leafフォルダ内のファイルをクリック");
                if (onImageSelect) {
                  console.log("画像選択処理を実行");
                  onImageSelect(foldername);
                } else {
                  console.log(
                    "画像選択処理をスキップ - onImageSelectが存在しません"
                  );
                }
              } else {
                console.log("通常フォルダをクリック - フォルダ移動処理");
                setSelectedFolder(foldername);
              }
            }}
          >
            {isLeaf ? <></> : <span className="arrow">{"＞"}</span>}
            <img
              className="img-icon"
              src={
                isLeaf
                  ? "/assets/image-file-icon.svg"
                  : isEmpty
                  ? "/assets/empty-folder-icon.svg" // 空フォルダの場合
                  : "/assets/folder-icon.svg" // 通常のフォルダの場合
              }
              alt=""
            />
            <span className="folder-name-span">
              {getFolderName(result, foldername)}
              {folderIsLeaf && imageCount > 0 && (
                <span className="image-count">({imageCount})</span>
              )}
            </span>
            {/* 3点リーダーとコンテキストメニュー（フォルダのみ表示） */}
            {!isLeaf && (
              <>
                <button
                  className="context-menu-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContextMenuClick(idx);
                  }}
                >
                  ⋮
                </button>
                {contextMenuIndex === idx && (
                  <div className="context-menu">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRenameFolder(foldername);
                      }}
                    >
                      名前の変更
                    </button>
                    {isEmpty && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFolder(foldername);
                        }}
                      >
                        削除
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ListView;
