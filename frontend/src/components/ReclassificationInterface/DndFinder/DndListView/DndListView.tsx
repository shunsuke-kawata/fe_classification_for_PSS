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
} from "@/utils/result";
import { useEffect } from "react";

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
}: dndListViewProps) => {
  // 配列形式のpropsを出力
  console.log("=== DndListView 配列形式props ===");
  console.log("folders:", folders);
  console.log("movedImages:", movedImages);
  console.log("selectedImages:", selectedImages);

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
                      isLeaf
                        ? () => {}
                        : isMultiSelectMode
                        ? () => handleFolderClick(item.key)
                        : () => setSelectedFolder(item.key)
                    }
                  >
                    <span className="arrow">{"＞"}</span>
                    <img
                      className="img-icon"
                      src={"/assets/folder-icon.svg"}
                      alt=""
                    />
                    <span className="folder-name-span">
                      {isFolderLeaf && imageCount > 0
                        ? `${item.key} (${imageCount})`
                        : item.key}
                    </span>
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

                return (
                  <div
                    key={idx}
                    className={`dnd-folder-icon-item ${
                      isMultiSelectMode ? "selectable" : ""
                    } ${selectedImages.includes(item.key) ? "selected" : ""}`}
                    draggable={!isLeaf}
                    onDragStart={(e) => handleFolderDragStart(e, item.key)}
                    onClick={
                      isLeaf
                        ? () => {}
                        : isMultiSelectMode
                        ? () => handleFolderClick(item.key)
                        : () => setSelectedFolder(item.key)
                    }
                  >
                    <div className="folder-icon-container">
                      <img
                        className="folder-icon-large"
                        src={"/assets/folder-icon.svg"}
                        alt=""
                      />
                      {previewImagePath && isFolderLeaf && (
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
                    </div>
                    <span className="folder-name-label">
                      {isFolderLeaf && imageCount > 0
                        ? `${item.key} (${imageCount})`
                        : item.key}
                    </span>
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
                      isLeaf
                        ? () => {}
                        : isMultiSelectMode
                        ? () => handleFolderClick(item.key)
                        : () => setSelectedFolder(item.key)
                    }
                  >
                    <span className="arrow">{"＞"}</span>
                    <img
                      className="img-icon"
                      src={"/assets/folder-icon.svg"}
                      alt=""
                    />
                    <span className="folder-name-span">
                      {isFolderLeaf && imageCount > 0
                        ? `${item.key} (${imageCount})`
                        : item.key}
                    </span>
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

                return (
                  <div
                    key={idx}
                    className={`dnd-folder-icon-item ${
                      isMultiSelectMode ? "selectable" : ""
                    } ${selectedImages.includes(item.key) ? "selected" : ""}`}
                    draggable={!isLeaf}
                    onDragStart={(e) => handleFolderDragStart(e, item.key)}
                    onClick={
                      isLeaf
                        ? () => {}
                        : isMultiSelectMode
                        ? () => handleFolderClick(item.key)
                        : () => setSelectedFolder(item.key)
                    }
                  >
                    <div className="folder-icon-container">
                      <img
                        className="folder-icon-large"
                        src={"/assets/folder-icon.svg"}
                        alt=""
                      />
                      {previewImagePath && isFolderLeaf && (
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
                    </div>
                    <span className="folder-name-label">
                      {isFolderLeaf && imageCount > 0
                        ? `${item.key} (${imageCount})`
                        : item.key}
                    </span>
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
