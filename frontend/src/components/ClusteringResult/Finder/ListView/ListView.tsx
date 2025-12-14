import "./styles.modules.css";
import {
  treeNode,
  getImageCountInFolder,
  isLeaf as isLeafFunction,
  findNodeById,
  getFolderName,
} from "@/utils/result";
import { useState, useEffect } from "react";
import { deleteEmptyFolders, renameFolderOrFile } from "@/api/api";

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

  // 編集モードの状態管理
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState<string>("");

  // コンテキストメニューのハンドラー
  const handleContextMenuClick = (index: number) => {
    setContextMenuIndex(contextMenuIndex === index ? null : index);
  };

  const handleRenameFolder = (folderName: string, index: number) => {
    console.log("フォルダ名変更:", folderName);
    setContextMenuIndex(null);

    // 編集モードに入る
    setEditingIndex(index);
    const currentName = getFolderName(result, folderName);
    setEditingName(currentName);
  };

  // 名前変更の確定
  const handleNameChangeConfirm = async (folderId: string) => {
    console.log("=== 名前変更確定 ===");
    console.log("フォルダID:", folderId);
    console.log("新しい名前:", editingName);
    console.log("mongo_result_id:", mongo_result_id);

    // mongo_result_idの存在チェック
    if (!mongo_result_id) {
      console.error("mongo_result_id が設定されていません");
      alert("名前変更に失敗しました：mongo_result_id が設定されていません");
      return;
    }

    // 名前が空でないかチェック
    if (!editingName.trim()) {
      console.error("新しい名前が空です");
      alert("名前を入力してください");
      return;
    }

    try {
      console.log(`名前変更API呼び出し: ${folderId} -> ${editingName}`);

      // フォルダがleafかどうかを判定
      const folderIsLeaf = isLeafFunction(result, folderId);

      const response = await renameFolderOrFile(
        mongo_result_id,
        folderId,
        editingName.trim(),
        folderIsLeaf
      );

      console.log("名前変更API応答:", response);

      // 成功レスポンスの判定：message が "success" かどうかで判定
      if (response && response.message === "success") {
        console.log(
          `✅ 「${folderId}」の名前を「${editingName}」に変更しました`
        );

        // ページをリロードして最新状態を反映
        window.location.reload();
      } else {
        // エラーレスポンスの場合
        const errorMessage = response?.message || "名前変更に失敗しました";
        console.error("名前変更失敗:", errorMessage);
        alert(`名前変更に失敗しました: ${errorMessage}`);
      }
    } catch (error) {
      console.error("名前変更エラー:", error);

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

      alert(`名前変更に失敗しました: ${errorMessage}`);
    } finally {
      // 編集モードを終了
      setEditingIndex(null);
      setEditingName("");
    }
  };

  // 名前変更のキャンセル
  const handleNameChangeCancel = () => {
    console.log("名前変更キャンセル");
    setEditingIndex(null);
    setEditingName("");
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

  // 文字列を省略する関数（拡張子より前を省略：前8文字 + ... + 後8文字）
  const truncateFileName = (fileName: string): string => {
    // 文字列が短い場合は省略しない（8 + 3 + 8 = 19文字以下）
    if (fileName.length <= 19) {
      return fileName;
    }

    // 拡張子を分離
    const lastDotIndex = fileName.lastIndexOf(".");

    // 拡張子がない、または最初/最後の文字がドットの場合
    if (lastDotIndex <= 0 || lastDotIndex === fileName.length - 1) {
      // 拡張子なしの場合は全体を省略対象にする
      const front = fileName.substring(0, 8);
      const back = fileName.substring(fileName.length - 8);
      return front + "..." + back;
    }

    // 拡張子より前の部分（ベース名）
    const baseName = fileName.substring(0, lastDotIndex);
    const extension = fileName.substring(lastDotIndex); // ".png" など

    // ベース名が短い場合は省略しない
    if (baseName.length <= 16) {
      return fileName;
    }

    // ベース名の前8文字と後8文字を取得
    const front = baseName.substring(0, 8);
    const back = baseName.substring(baseName.length - 8);

    return front + "..." + back + extension;
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
              if (editingIndex === idx) {
                // 編集モード時はクリックを無効化
                return;
              }

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
            {editingIndex === idx ? (
              <>
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleNameChangeConfirm(foldername);
                    } else if (e.key === "Escape") {
                      handleNameChangeCancel();
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="folder-name-input"
                  autoFocus
                />
                {/* 編集時の確定・キャンセルボタンを右端に配置 */}
                <div className="edit-buttons-container">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNameChangeConfirm(foldername);
                    }}
                    className="edit-confirm-btn"
                  >
                    ✓
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNameChangeCancel();
                    }}
                    className="edit-cancel-btn"
                  >
                    ✗
                  </button>
                </div>
              </>
            ) : (
              <>
                <span
                  className="folder-name-span"
                  title={getFolderName(result, foldername)}
                >
                  {isLeaf
                    ? truncateFileName(getFolderName(result, foldername))
                    : getFolderName(result, foldername)}
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
                            handleRenameFolder(foldername, idx);
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
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ListView;
