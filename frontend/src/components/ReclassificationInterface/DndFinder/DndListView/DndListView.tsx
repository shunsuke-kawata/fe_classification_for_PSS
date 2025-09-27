import "./styles.modules.css";
import config from "@/config/config.json";
import FileThumbnail from "@/components/FileThumbnail/FileThumbnail";
import { finderType } from "../DndFinder";
import {
  isLeaf as isLeafFunction,
  treeNode,
  getFilesInFolder,
} from "@/utils/result";
import { useEffect } from "react";

interface dndListViewProps {
  finderType: finderType;
  isLeaf: boolean;
  folders: string[];
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
      console.log("ドラッグ開始:", data);
    } else {
      e.preventDefault();
      console.log("ドラッグ無効: 右のFinderがフォルダ表示のため");
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
      console.log("フォルダドラッグ開始:", data);
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
      console.log("フォルダドラッグ開始:", data);
    }
  };

  const handleFolderClick = (folderId: string) => {
    if (isMultiSelectMode && onImageSelect) {
      onImageSelect(folderId);
    }
  };

  //forldersファイルnameのstringが渡されてしまっているので変更する
  useEffect(() => {
    console.log("current--------------", folders);
  }, [folders]);

  return (
    <>
      {finderType === "before" ? (
        <>
          {/* 移動前のFinderUI Draggable */}
          {isLeaf ? (
            <div className="dnd-image-file-view-main">
              {folders
                .filter((foldername) => !movedImages.includes(foldername))
                .map((foldername, idx) => (
                  <div
                    key={idx}
                    className={`dnd-image-file-item ${
                      selectedImages.includes(foldername) ? "selected" : ""
                    } ${isMultiSelectMode ? "selectable" : ""}`}
                    draggable={!isMultiSelectMode}
                    onDragStart={(e) => handleDragStart(e, foldername)}
                    onClick={() => handleImageClick(foldername)}
                  >
                    <FileThumbnail
                      imagePath={`${baseOriginalImageFolderPath}/${foldername}`}
                      width={80}
                      height={80}
                      padding={1}
                    />
                    {isMultiSelectMode &&
                      selectedImages.includes(foldername) && (
                        <div className="selection-indicator">✓</div>
                      )}
                  </div>
                ))}
            </div>
          ) : viewMode === "list" ? (
            <div className="list-view-main">
              {folders.map((foldername, idx) => {
                // 各フォルダがisLeafかどうかをチェック
                const isFolderLeaf =
                  result && isLeafFunction
                    ? isLeafFunction(result, foldername)
                    : false;

                // isLeafフォルダの場合、画像枚数を取得
                const imageCount =
                  isFolderLeaf && result
                    ? Object.keys(getFilesInFolder(result, foldername)).length
                    : 0;

                return (
                  <div
                    key={idx}
                    className={`list-view-item ${
                      idx % 2 === 0
                        ? "list-view-item-even"
                        : "list-view-item-odd"
                    } ${isMultiSelectMode ? "selectable" : ""} ${
                      selectedImages.includes(foldername) ? "selected" : ""
                    }`}
                    draggable={!isLeaf}
                    onDragStart={(e) => handleFolderDragStart(e, foldername)}
                    onClick={
                      isLeaf
                        ? () => {}
                        : isMultiSelectMode
                        ? () => handleFolderClick(foldername)
                        : () => setSelectedFolder(foldername)
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
                        ? `${foldername} (${imageCount})`
                        : foldername}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="dnd-image-file-view-main">
              {folders.map((foldername, idx) => {
                // 各フォルダがisLeafかどうかを個別にチェック
                const isFolderLeaf =
                  result && isLeafFunction
                    ? isLeafFunction(result, foldername)
                    : false;
                const previewImagePath = isFolderLeaf
                  ? getFolderPreviewImagePath?.(foldername)
                  : null;

                return (
                  <div
                    key={idx}
                    className={`dnd-folder-icon-item ${
                      isMultiSelectMode ? "selectable" : ""
                    } ${selectedImages.includes(foldername) ? "selected" : ""}`}
                    draggable={!isLeaf}
                    onDragStart={(e) => handleFolderDragStart(e, foldername)}
                    onClick={
                      isLeaf
                        ? () => {}
                        : isMultiSelectMode
                        ? () => handleFolderClick(foldername)
                        : () => setSelectedFolder(foldername)
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
                      {selectedImages.includes(foldername) && (
                        <div className="selection-indicator">✓</div>
                      )}
                    </div>
                    <span className="folder-name-label">{foldername}</span>
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
              {folders.map((foldername, idx) => (
                <div key={idx} className="dnd-image-file-item">
                  <FileThumbnail
                    imagePath={`${baseOriginalImageFolderPath}/${foldername}`}
                    width={80}
                    height={80}
                    padding={1}
                  />
                </div>
              ))}
            </div>
          ) : viewMode === "list" ? (
            <div className="list-view-main">
              {folders.map((foldername, idx) => {
                // 各フォルダがisLeafかどうかをチェック
                const isFolderLeaf =
                  result && isLeafFunction
                    ? isLeafFunction(result, foldername)
                    : false;

                // isLeafフォルダの場合、画像枚数を取得
                const imageCount =
                  isFolderLeaf && result
                    ? Object.keys(getFilesInFolder(result, foldername)).length
                    : 0;

                return (
                  <div
                    key={idx}
                    className={`list-view-item ${
                      idx % 2 === 0
                        ? "list-view-item-even"
                        : "list-view-item-odd"
                    } ${isMultiSelectMode ? "selectable" : ""} ${
                      selectedImages.includes(foldername) ? "selected" : ""
                    }`}
                    draggable={!isLeaf}
                    onDragStart={(e) => handleFolderDragStart(e, foldername)}
                    onClick={
                      isLeaf
                        ? () => {}
                        : isMultiSelectMode
                        ? () => handleFolderClick(foldername)
                        : () => setSelectedFolder(foldername)
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
                        ? `${foldername} (${imageCount})`
                        : foldername}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="dnd-image-file-view-main">
              {folders.map((foldername, idx) => {
                // 各フォルダがisLeafかどうかを個別にチェック
                const isFolderLeaf =
                  result && isLeafFunction
                    ? isLeafFunction(result, foldername)
                    : false;
                const previewImagePath = isFolderLeaf
                  ? getFolderPreviewImagePath?.(foldername)
                  : null;

                return (
                  <div
                    key={idx}
                    className={`dnd-folder-icon-item ${
                      isMultiSelectMode ? "selectable" : ""
                    } ${selectedImages.includes(foldername) ? "selected" : ""}`}
                    draggable={!isLeaf}
                    onDragStart={(e) => handleFolderDragStart(e, foldername)}
                    onClick={
                      isLeaf
                        ? () => {}
                        : isMultiSelectMode
                        ? () => handleFolderClick(foldername)
                        : () => setSelectedFolder(foldername)
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
                      {selectedImages.includes(foldername) && (
                        <div className="selection-indicator">✓</div>
                      )}
                    </div>
                    <span className="folder-name-label">{foldername}</span>
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
