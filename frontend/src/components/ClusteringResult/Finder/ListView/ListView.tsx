import "./styles.modules.css";
import {
  treeNode,
  getImageCountInFolder,
  isLeaf as isLeafFunction,
  findNodeById,
} from "@/utils/result";
import { useState, useEffect } from "react";

interface listViewProps {
  isLeaf: boolean;
  folders: string[];
  setSelectedFolder: React.Dispatch<React.SetStateAction<string>>;
  result: {
    [topLevelNodeId: string]: treeNode;
  };
  onImageSelect?: (imagePath: string) => void;
  selectedImagePath?: string;
}
const ListView: React.FC<listViewProps> = ({
  isLeaf,
  folders,
  setSelectedFolder,
  result,
  onImageSelect,
  selectedImagePath,
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

  const handleDeleteFolder = (folderName: string) => {
    console.log("フォルダ削除:", folderName);
    setContextMenuIndex(null);
  };

  // コンテキストメニューを閉じるためのクリックハンドラー
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
              {foldername}
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
