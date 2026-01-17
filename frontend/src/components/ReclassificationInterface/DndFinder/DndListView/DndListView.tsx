import "./styles.modules.css";
import config from "@/config/config.json";
import FileThumbnail from "@/components/FileThumbnail/FileThumbnail";
import { finderType } from "../DndFinder";
import {
  isLeaf as isLeafFunction,
  treeNode,
  getFilesInFolder,
  leafData,
  getImageCountInFolder,
  findNodeById,
  getFolderName,
} from "@/utils/result";
import { useEffect, useState } from "react";
import { deleteEmptyFolders, renameFolderOrFile } from "@/api/api";

interface dndListViewProps {
  finderType: finderType;
  isLeaf: boolean;
  folders: string[] | leafData;
  originalImageFolderPath: string;
  setSelectedFolder: React.Dispatch<React.SetStateAction<string>>;
  movedImages?: string[];
  isMultiSelectMode?: boolean;
  selectedImages?: string[];
  onImageSelect?: (imagePath: string) => void;
  currentFolder?: string;
  viewMode?: "list" | "icon";
  getFolderPreviewImage?: (folderName: string) => string | null;
  getFolderPreviewImagePath?: (folderName: string) => string | null;
  result?: { [topLevelNodeId: string]: treeNode };
  mongo_result_id?: string;
}
const DndListView: React.FC<dndListViewProps> = ({
  finderType,
  isLeaf,
  folders,
  originalImageFolderPath,
  setSelectedFolder,
  movedImages = [],
  isMultiSelectMode = false,
  selectedImages = [],
  onImageSelect,
  currentFolder,
  viewMode = "list",
  getFolderPreviewImage,
  getFolderPreviewImagePath,
  result,
  mongo_result_id,
}: dndListViewProps) => {
  // 配列形式のpropsを出力

  // コンテキストメニューの状態管理
  const [contextMenuIndex, setContextMenuIndex] = useState<number | null>(null);

  // 編集モードの状態管理
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState<string>("");

  // foldersを統一的に扱うためのヘルパー関数
  const getFolderItems = (): Array<{ key: string; value: string }> => {
    if (Array.isArray(folders)) {
      // 配列の場合：フォルダ名のみ（keyとvalueが同じ）
      return folders.map((folder) => ({ key: folder, value: folder }));
    } else {
      // オブジェクトの場合：キーと値を分ける（ファイル名とパス）
      return Object.entries(folders).map(([key, value]) => ({ key, value }));
    }
  };

  // 空フォルダかどうかを判定する関数
  const isFolderEmpty = (folderName: string): boolean => {
    if (!result) return false;
    const node = findNodeById(result, folderName);
    if (!node || !node.data) {
      return true; // ノードが見つからない、またはdataがない場合は空と判定
    }

    // is_leafの場合のみ、有効な文字列データのみをカウント（表示できないデータは無視）
    if (node.is_leaf) {
      const validEntries = Object.values(node.data).filter(
        (value) => typeof value === "string" && value.trim() !== ""
      );
      return validEntries.length === 0;
    }

    // is_leafでない場合は従来通り、dataが空のオブジェクト{}かどうかを判定
    return Object.keys(node.data).length === 0;
  };

  const folderItems = getFolderItems();

  const baseOriginalImageFolderPath = `${config.backend_base_url}/images/${originalImageFolderPath}`;
  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    imagePath: string
  ) => {
    // 右のFinderがisLeafでない場合はドラッグを無効化
    if (finderType === "before") {
      const data = JSON.stringify({
        path: imagePath,
        sourceType: finderType,
        sourceFolder: currentFolder,
        selectedImages: isMultiSelectMode ? selectedImages : [],
      });
      e.dataTransfer.setData("text/plain", data);
    } else {
      e.preventDefault();
    }
  };

  const handleImageClick = (imagePath: string) => {
    if (isMultiSelectMode && onImageSelect) {
      onImageSelect(imagePath);
    }
  };

  const handleFolderDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    folderId: string
  ) => {
    if (finderType === "before") {
      const data = JSON.stringify({
        type: "folder",
        folderId: folderId,
        sourceType: finderType,
        sourceFolder: currentFolder,
        selectedFolders: isMultiSelectMode ? selectedImages : [],
      });
      e.dataTransfer.setData("text/plain", data);
    } else {
      // 右側のFinderでもフォルダのドラッグを許可
      const data = JSON.stringify({
        type: "folder",
        folderId: folderId,
        sourceType: finderType,
        sourceFolder: currentFolder,
        selectedFolders: isMultiSelectMode ? selectedImages : [],
      });
      e.dataTransfer.setData("text/plain", data);
    }
  };

  const handleFolderClick = (folderId: string) => {
    if (isMultiSelectMode && onImageSelect) {
      onImageSelect(folderId);
    }
  };

  // コンテキストメニューのハンドラー
  const handleContextMenuClick = (index: number) => {
    setContextMenuIndex(contextMenuIndex === index ? -1 : index);
  };

  const handleRenameFolder = (folderName: string, index: number) => {
    console.log("フォルダ名変更:", folderName);
    setContextMenuIndex(-1);

    // 編集モードに入る
    setEditingIndex(index);
    const currentName = result ? getFolderName(result, folderName) : folderName;
    setEditingName(currentName);
  };

  // 名前変更の確定
  const handleNameChangeConfirm = async (folderId: string) => {
    console.log("=== 名前変更確定 ===");
    console.log("mongo_result_id:", mongo_result_id);
    console.log("folder node_id:", folderId);
    console.log("新しい名前:", editingName);

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
      const folderIsLeaf = result ? isLeafFunction(result, folderId) : false;

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
    console.log("Delete folder:", folderName);
    setContextMenuIndex(-1);

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
  };

  // コンテキストメニューを閉じるためのクリックハンドラー
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenuIndex(-1);
    };

    if (contextMenuIndex !== -1) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [contextMenuIndex]);

  //forldersファイルnameのstringが渡されてしまっているので変更する
  useEffect(() => {
    // フォルダ情報の監視（デバッグ用のログを削除）
  }, [folders]);

  return (
    <>
      {finderType === "before" ? (
        <>
          {/* 移動前のFinderUI Draggable */}
          {isLeaf ? (
            <div className="dnd-image-file-view-main">
              {folderItems
                .filter((item) => !movedImages.includes(item.key))
                .map((item, idx) => (
                  <div
                    key={idx}
                    className={`dnd-image-file-item ${
                      selectedImages.includes(item.key) ? "selected" : ""
                    } ${isMultiSelectMode ? "selectable" : ""}`}
                    draggable={!isMultiSelectMode}
                    onDragStart={(e) => handleDragStart(e, item.key)}
                    onClick={() => handleImageClick(item.key)}
                  >
                    <FileThumbnail
                      imagePath={`${baseOriginalImageFolderPath}/${item.value}`}
                      width={80}
                      height={80}
                      padding={1}
                    />
                    {isMultiSelectMode && selectedImages.includes(item.key) && (
                      <div className="selection-indicator">✓</div>
                    )}
                  </div>
                ))}
            </div>
          ) : viewMode === "list" ? (
            <div className="list-view-main">
              {folderItems.map((item, idx) => {
                // 各フォルダがisLeafかどうかをチェック
                const isFolderLeaf =
                  result && isLeafFunction
                    ? isLeafFunction(result, item.key)
                    : false;

                // isLeafフォルダの場合、画像枚数を取得
                const imageCount =
                  isFolderLeaf && result
                    ? Object.keys(getFilesInFolder(result, item.key)).length
                    : 0;

                // フォルダが空かどうかを判定
                const isEmpty = isFolderEmpty(item.key);

                return (
                  <div
                    key={idx}
                    className={`list-view-item ${
                      idx % 2 === 0
                        ? "list-view-item-even"
                        : "list-view-item-odd"
                    } ${isMultiSelectMode ? "selectable" : ""} ${
                      selectedImages.includes(item.key) ? "selected" : ""
                    }`}
                    draggable={!isLeaf}
                    onDragStart={(e) => handleFolderDragStart(e, item.key)}
                    onClick={
                      editingIndex === idx
                        ? (e) => e.preventDefault() // 編集モード時はクリックを無効化
                        : isLeaf
                        ? () => {}
                        : isMultiSelectMode
                        ? () => handleFolderClick(item.key)
                        : () => setSelectedFolder(item.key)
                    }
                  >
                    <span className="arrow">{"＞"}</span>
                    <img
                      className="img-icon"
                      src={
                        isEmpty
                          ? "/assets/empty-folder-icon.svg"
                          : "/assets/folder-icon.svg"
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
                              handleNameChangeConfirm(item.key);
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
                              handleNameChangeConfirm(item.key);
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
                        <span className="folder-name-span">
                          {isFolderLeaf && imageCount > 0
                            ? `${
                                result
                                  ? getFolderName(result, item.key)
                                  : item.key
                              } (${imageCount})`
                            : result
                            ? getFolderName(result, item.key)
                            : item.key}
                        </span>
                        {/* 3点リーダーとコンテキストメニュー */}
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
                                handleRenameFolder(item.key, idx);
                              }}
                            >
                              名前の変更
                            </button>
                            {isEmpty && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteFolder(item.key);
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
          ) : (
            <div className="dnd-image-file-view-main">
              {folderItems.map((item, idx) => {
                // 各フォルダがisLeafかどうかを個別にチェック
                const isFolderLeaf =
                  result && isLeafFunction
                    ? isLeafFunction(result, item.key)
                    : false;
                const previewImagePath = isFolderLeaf
                  ? getFolderPreviewImagePath?.(item.key)
                  : null;

                // isLeafフォルダの場合、画像枚数を取得
                const imageCount =
                  isFolderLeaf && result
                    ? Object.keys(getFilesInFolder(result, item.key)).length
                    : 0;

                // フォルダが空かどうかを判定
                const isEmpty = isFolderEmpty(item.key);

                return (
                  <div
                    key={idx}
                    className={`dnd-folder-icon-item ${
                      isMultiSelectMode ? "selectable" : ""
                    } ${selectedImages.includes(item.key) ? "selected" : ""}`}
                    draggable={!isLeaf}
                    onDragStart={(e) => handleFolderDragStart(e, item.key)}
                  >
                    <div
                      className="folder-icon-container"
                      onClick={
                        editingIndex === idx
                          ? (e) => e.preventDefault() // 編集モード時はクリックを無効化
                          : isLeaf
                          ? () => {}
                          : isMultiSelectMode
                          ? () => handleFolderClick(item.key)
                          : () => setSelectedFolder(item.key)
                      }
                    >
                      <img
                        className="folder-icon-large"
                        src={
                          isEmpty
                            ? "/assets/empty-folder-icon.svg"
                            : "/assets/folder-icon.svg"
                        }
                        alt=""
                      />
                      {previewImagePath && isFolderLeaf && !isEmpty && (
                        <div className="folder-preview-overlay">
                          <img
                            src={previewImagePath}
                            alt=""
                            style={{
                              width: "60px",
                              height: "60px",
                              objectFit: "cover",
                              borderRadius: "4px",
                            }}
                            onError={(e) => {
                              // 画像の読み込みに失敗した場合は非表示にする
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      )}
                      {selectedImages.includes(item.key) && (
                        <div className="selection-indicator">✓</div>
                      )}
                      {/* 3点リーダーボタン（アイコンモード用） */}
                      <button
                        className="context-menu-button-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContextMenuClick(idx);
                        }}
                      >
                        ⋮
                      </button>
                      {contextMenuIndex === idx && (
                        <div className="context-menu-icon">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRenameFolder(item.key, idx);
                            }}
                          >
                            名前の変更
                          </button>
                          {isEmpty && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFolder(item.key);
                              }}
                            >
                              削除
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    {editingIndex === idx ? (
                      <div className="folder-name-edit-container">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleNameChangeConfirm(item.key);
                            } else if (e.key === "Escape") {
                              handleNameChangeCancel();
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="folder-name-input-icon"
                          autoFocus
                        />
                        <div className="edit-buttons-icon">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNameChangeConfirm(item.key);
                            }}
                            className="edit-confirm-btn-icon"
                          >
                            ✓
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNameChangeCancel();
                            }}
                            className="edit-cancel-btn-icon"
                          >
                            ✗
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="folder-name-label">
                        {isFolderLeaf && imageCount > 0
                          ? `${
                              result
                                ? getFolderName(result, item.key)
                                : item.key
                            } (${imageCount})`
                          : result
                          ? getFolderName(result, item.key)
                          : item.key}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : finderType === "after" ? (
        <>
          {/* 移動後のFinderUI Droppable*/}
          {isLeaf ? (
            <div className="dnd-image-file-view-main">
              {/* 移動された画像を表示 */}
              {movedImages.map((imagePath, idx) => (
                <div key={`moved-${idx}`} className="dnd-image-file-item">
                  <FileThumbnail
                    imagePath={`${baseOriginalImageFolderPath}/${imagePath}`}
                    width={80}
                    height={80}
                    padding={1}
                  />
                </div>
              ))}
              {/* 元のフォルダの画像も表示 */}
              {folderItems.map((item, idx) => (
                <div key={idx} className="dnd-image-file-item">
                  <FileThumbnail
                    imagePath={`${baseOriginalImageFolderPath}/${item.value}`}
                    width={80}
                    height={80}
                    padding={1}
                  />
                </div>
              ))}
            </div>
          ) : viewMode === "list" ? (
            <div className="list-view-main">
              {folderItems.map((item, idx) => {
                // 各フォルダがisLeafかどうかをチェック
                const isFolderLeaf =
                  result && isLeafFunction
                    ? isLeafFunction(result, item.key)
                    : false;

                // isLeafフォルダの場合、画像枚数を取得
                const imageCount =
                  isFolderLeaf && result
                    ? Object.keys(getFilesInFolder(result, item.key)).length
                    : 0;

                // フォルダが空かどうかを判定
                const isEmpty = isFolderEmpty(item.key);

                return (
                  <div
                    key={idx}
                    className={`list-view-item ${
                      idx % 2 === 0
                        ? "list-view-item-even"
                        : "list-view-item-odd"
                    } ${isMultiSelectMode ? "selectable" : ""} ${
                      selectedImages.includes(item.key) ? "selected" : ""
                    }`}
                    draggable={!isLeaf}
                    onDragStart={(e) => handleFolderDragStart(e, item.key)}
                    onClick={
                      editingIndex === idx
                        ? (e) => e.preventDefault() // 編集モード時はクリックを無効化
                        : isLeaf
                        ? () => {}
                        : isMultiSelectMode
                        ? () => handleFolderClick(item.key)
                        : () => setSelectedFolder(item.key)
                    }
                  >
                    <span className="arrow">{"＞"}</span>
                    <img
                      className="img-icon"
                      src={
                        isEmpty
                          ? "/assets/empty-folder-icon.svg"
                          : "/assets/folder-icon.svg"
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
                              handleNameChangeConfirm(item.key);
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
                              handleNameChangeConfirm(item.key);
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
                        <span className="folder-name-span">
                          {isFolderLeaf && imageCount > 0
                            ? `${
                                result
                                  ? getFolderName(result, item.key)
                                  : item.key
                              } (${imageCount})`
                            : result
                            ? getFolderName(result, item.key)
                            : item.key}
                        </span>
                        {/* 3点リーダーとコンテキストメニュー */}
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
                                handleRenameFolder(item.key, idx);
                              }}
                            >
                              名前の変更
                            </button>
                            {isEmpty && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteFolder(item.key);
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
          ) : (
            <div className="dnd-image-file-view-main">
              {folderItems.map((item, idx) => {
                // 各フォルダがisLeafかどうかを個別にチェック
                const isFolderLeaf =
                  result && isLeafFunction
                    ? isLeafFunction(result, item.key)
                    : false;
                const previewImagePath = isFolderLeaf
                  ? getFolderPreviewImagePath?.(item.key)
                  : null;

                // isLeafフォルダの場合、画像枚数を取得
                const imageCount =
                  isFolderLeaf && result
                    ? Object.keys(getFilesInFolder(result, item.key)).length
                    : 0;

                // フォルダが空かどうかを判定
                const isEmpty = isFolderEmpty(item.key);

                return (
                  <div
                    key={idx}
                    className={`dnd-folder-icon-item ${
                      isMultiSelectMode ? "selectable" : ""
                    } ${selectedImages.includes(item.key) ? "selected" : ""}`}
                    draggable={!isLeaf}
                    onDragStart={(e) => handleFolderDragStart(e, item.key)}
                  >
                    <div
                      className="folder-icon-container"
                      onClick={
                        editingIndex === idx
                          ? (e) => e.preventDefault() // 編集モード時はクリックを無効化
                          : isLeaf
                          ? () => {}
                          : isMultiSelectMode
                          ? () => handleFolderClick(item.key)
                          : () => setSelectedFolder(item.key)
                      }
                    >
                      <img
                        className="folder-icon-large"
                        src={
                          isEmpty
                            ? "/assets/empty-folder-icon.svg"
                            : "/assets/folder-icon.svg"
                        }
                        alt=""
                      />
                      {previewImagePath && isFolderLeaf && !isEmpty && (
                        <div className="folder-preview-overlay">
                          <img
                            src={previewImagePath}
                            alt=""
                            style={{
                              width: "60px",
                              height: "60px",
                              objectFit: "cover",
                              borderRadius: "4px",
                            }}
                            onError={(e) => {
                              // 画像の読み込みに失敗した場合は非表示にする
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      )}
                      {selectedImages.includes(item.key) && (
                        <div className="selection-indicator">✓</div>
                      )}
                      {/* 3点リーダーボタン（アイコンモード用） */}
                      <button
                        className="context-menu-button-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContextMenuClick(idx);
                        }}
                      >
                        ⋮
                      </button>
                      {contextMenuIndex === idx && (
                        <div className="context-menu-icon">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRenameFolder(item.key, idx);
                            }}
                          >
                            名前の変更
                          </button>
                          {isEmpty && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFolder(item.key);
                              }}
                            >
                              削除
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    {editingIndex === idx ? (
                      <div className="folder-name-edit-container">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleNameChangeConfirm(item.key);
                            } else if (e.key === "Escape") {
                              handleNameChangeCancel();
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="folder-name-input-icon"
                          autoFocus
                        />
                        <div className="edit-buttons-icon">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNameChangeConfirm(item.key);
                            }}
                            className="edit-confirm-btn-icon"
                          >
                            ✓
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNameChangeCancel();
                            }}
                            className="edit-cancel-btn-icon"
                          >
                            ✗
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="folder-name-label">
                        {isFolderLeaf && imageCount > 0
                          ? `${
                              result
                                ? getFolderName(result, item.key)
                                : item.key
                            } (${imageCount})`
                          : result
                          ? getFolderName(result, item.key)
                          : item.key}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <></>
      )}
    </>
  );
};

export default DndListView;
