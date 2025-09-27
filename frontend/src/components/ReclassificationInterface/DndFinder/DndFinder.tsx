import { useEffect, useState, useCallback } from "react";

import DndBreadclumbs from "./DndBreadclumbs/DndBreadclumbs";
import DndListView from "./DndListView/DndListView";
import "./styles.modules.css";
import {
  findPathToNode,
  getFilesInFolder,
  getFoldersInFolder,
  getTopLevelFolderId,
  isLeaf,
  leafData,
  treeNode,
} from "@/utils/result";
import config from "@/config/config.json";
import { moveClusteringItems } from "@/api/api";

export type finderType = "before" | "after";

type dndFinderProps = {
  finderType: finderType;
  originalImageFolderPath: string;
  result: {
    [topLevelNodeId: string]: treeNode;
  };
  mongo_result_id: string;
  onFolderMoveComplete?: (
    targetFolderId: string,
    destinationFolderId: string
  ) => Promise<void>;
  onFolderChange?: (folderId: string) => void;
  targetFolder?: string | null;
  destinationFolder?: string | null;
};

const DndFinder: React.FC<dndFinderProps> = ({
  finderType,
  result,
  originalImageFolderPath,
  mongo_result_id,
  onFolderMoveComplete,
  onFolderChange,
  targetFolder,
  destinationFolder,
}: dndFinderProps) => {
  const topLevelId = getTopLevelFolderId(result);
  
  // 初期選択フォルダを決定（クエリパラメータがある場合はそれを使用）
  const getInitialFolder = (): string => {
    if (finderType === "before" && targetFolder) {
      return targetFolder;
    }
    if (finderType === "after" && destinationFolder) {
      return destinationFolder;
    }
    return topLevelId || "";
  };
  
  const [selectedFolder, setSelectedFolder] = useState<string>(
    getInitialFolder()
  );
  const [currentFolderState, setCurrentFolderState] = useState<{
    parentFolders: string[];
    files: leafData;
    folders: string[];
  }>({
    parentFolders: [],
    files: {},
    folders: [],
  });
  const [movedImages, setMovedImages] = useState<string[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState<boolean>(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "icon">("icon");

  const getNodesInCurrentFolder = (folderId: string) => {
    const folders = getFoldersInFolder(result, folderId);
    const files = getFilesInFolder(result, folderId);
    const path = findPathToNode(result, folderId) ?? [];

    //現在のフォルダ情報を更新
    setCurrentFolderState({
      ...currentFolderState,
      parentFolders: path,
      folders: folders ?? [],
      files: files ?? {},
    });
  };

  const getFolderPreviewImage = (folderName: string): string | null => {
    // フォルダ内の画像を取得（0番目の画像）
    const folderFiles = getFilesInFolder(result, folderName);

    if (folderFiles && Object.keys(folderFiles).length > 0) {
      const firstImage = Object.values(folderFiles)[0];
      return firstImage;
    }

    // フォルダが見つからない場合、フォルダ名をそのまま使用
    return folderName;
  };

  const getFolderPreviewImagePath = (folderName: string): string | null => {
    // フォルダ内の画像を取得してフルパスを生成
    const previewImage = getFolderPreviewImage(folderName);

    if (previewImage) {
      // 提供された例の形式: http://localhost:8008/images/jUL6JBa4RROGhBWv-_Ixpw/object_camera0_20241212_225845_x545_y552_1.png
      // 拡張子がない場合は .png を追加
      const imageFileName = previewImage.includes(".")
        ? previewImage
        : `${previewImage}.png`;
      const fullPath = `${config.backend_base_url}/images/${originalImageFolderPath}/${imageFileName}`;
      return fullPath;
    }
    return null;
  };

  // 移動が無効かどうかをチェックする関数
  const isInvalidMove = (
    foldersToMove: string[],
    targetFolder: string
  ): boolean => {
    // 判定基準1: 移動先のフォルダが移動したいフォルダ一覧に含まれていないか
    if (foldersToMove.includes(targetFolder)) {
      return true;
    }

    // 判定基準2: 移動先のフォルダの親フォルダ一覧に移動したいフォルダに含まれているフォルダがないか
    const targetPath = findPathToNode(result, targetFolder);
    if (targetPath) {
      for (const folderToMove of foldersToMove) {
        if (targetPath.includes(folderToMove)) {
          return true;
        }
      }
    }

    return false;
  };

  useEffect(() => {
    getNodesInCurrentFolder(selectedFolder);
    // フォルダが変わったら選択状態をリセット
    setSelectedImages([]);
    setIsMultiSelectMode(false);

    // フォルダ変更を親コンポーネントに通知
    if (onFolderChange && selectedFolder) {
      onFolderChange(selectedFolder);
    }
  }, [selectedFolder]);

  // クエリパラメータが変更された時に選択フォルダを更新
  useEffect(() => {
    let newFolder = "";
    if (finderType === "before" && targetFolder) {
      newFolder = targetFolder;
    } else if (finderType === "after" && destinationFolder) {
      newFolder = destinationFolder;
    } else {
      newFolder = topLevelId || "";
    }
    
    if (newFolder && newFolder !== selectedFolder) {
      setSelectedFolder(newFolder);
    }
  }, [targetFolder, destinationFolder, finderType, topLevelId]);

  const handleMultiSelectToggle = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    if (isMultiSelectMode) {
      setSelectedImages([]);
    }
  };

  const handleImageSelect = (imagePath: string) => {
    if (!isMultiSelectMode) return;

    setSelectedImages((prev) => {
      if (prev.includes(imagePath)) {
        return prev.filter((path) => path !== imagePath);
      } else {
        return [...prev, imagePath];
      }
    });
  };

  const handleMoveSelectedImages = async (
    imagesToMove: string[],
    sourceFolder: string,
    targetFolder: string
  ) => {
    try {
      // 単独ファイルの移動時も配列として処理
      const sources = Array.isArray(imagesToMove)
        ? imagesToMove
        : [imagesToMove];

      // 利用可能なフォルダ一覧を表示
      const availableFolders = topLevelId
        ? getFoldersInFolder(result, topLevelId)
        : [];

      const response = await moveClusteringItems(
        mongo_result_id,
        "images",
        sources,
        targetFolder
      );

      // レスポンスの構造を確認
      if (
        response &&
        (response.status === 200 || response.statusCode === 200)
      ) {
        setMovedImages((prev) => [...prev, ...imagesToMove]);
        setSelectedImages([]);
        setIsMultiSelectMode(false);

        // フォルダ移動完了のコールバックを呼び出し
        if (onFolderMoveComplete) {
          await onFolderMoveComplete(sourceFolder, targetFolder);
        }

        alert(
          `✅ まとめて移動成功!\n${imagesToMove.length}個の画像を移動しました`
        );
      } else {
        console.error("移動に失敗しました - 詳細:");
        console.error("response:", response);
        console.error("response.status:", response?.status);
        console.error("response.statusCode:", response?.statusCode);
        console.error("response.data:", response?.data);

        const errorMessage =
          response?.data?.message ||
          response?.message ||
          `HTTP ${response?.status || response?.statusCode || "Unknown"}`;

        alert(`❌ 移動に失敗しました\n${errorMessage}`);
      }
    } catch (error) {
      console.error("=== 移動処理でエラーが発生 ===");
      console.error("error:", error);
      console.error("error.message:", (error as any)?.message);
      console.error("error.response:", (error as any)?.response);
      console.error("error.response?.data:", (error as any)?.response?.data);
      console.error(
        "error.response?.status:",
        (error as any)?.response?.status
      );

      const errorMessage =
        (error as any)?.response?.data?.message ||
        (error as any)?.message ||
        "不明なエラーが発生しました";

      alert(`❌ 移動に失敗しました\n${errorMessage}`);
    }
  };

  const handleMoveSelectedFolders = async (
    foldersToMove: string[],
    sourceFolder: string,
    targetFolder: string
  ) => {
    try {
      // 単独フォルダの移動時も配列として処理
      const sources = Array.isArray(foldersToMove)
        ? foldersToMove
        : [foldersToMove];

      // 利用可能なフォルダ一覧を表示
      const availableFolders = topLevelId
        ? getFoldersInFolder(result, topLevelId)
        : [];

      const response = await moveClusteringItems(
        mongo_result_id,
        "folders",
        sources,
        targetFolder
      );

      // レスポンスの構造を確認
      if (
        response &&
        (response.status === 200 || response.statusCode === 200)
      ) {
        setSelectedImages([]);
        setIsMultiSelectMode(false);

        // 移動完了をコールバックで通知
        if (onFolderMoveComplete) {
          onFolderMoveComplete(foldersToMove[0], targetFolder);
        }

        alert(
          `✅ フォルダ移動完了!\n移動したフォルダ: ${foldersToMove.length}個\n移動先: ${targetFolder}`
        );
      } else {
        console.error("フォルダ移動に失敗しました - 詳細:");
        console.error("response:", response);
        console.error("response.status:", response?.status);
        console.error("response.statusCode:", response?.statusCode);
        console.error("response.data:", response?.data);

        const errorMessage =
          response?.data?.message ||
          response?.message ||
          `HTTP ${response?.status || response?.statusCode || "Unknown"}`;

        alert(`❌ フォルダ移動に失敗しました\n${errorMessage}`);
      }
    } catch (error) {
      console.error("=== フォルダ移動処理でエラーが発生 ===");
      console.error("error:", error);
      console.error("error.message:", (error as any)?.message);
      console.error("error.response:", (error as any)?.response);
      console.error("error.response?.data:", (error as any)?.response?.data);
      console.error(
        "error.response?.status:",
        (error as any)?.response?.status
      );

      const errorMessage =
        (error as any)?.response?.data?.message ||
        (error as any)?.message ||
        "不明なエラーが発生しました";

      alert(`❌ フォルダ移動に失敗しました\n${errorMessage}`);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    // デバッグ用: すべてのドロップを許可
    const data = e.dataTransfer.getData("text/plain");

    if (!data) {
      console.error("ドロップされたデータが空です");
      return;
    }

    try {
      const dragData = JSON.parse(data);

      // フォルダ移動の処理
      if (dragData.type === "folder") {
        // フォルダ移動: 移動先のフォルダがisLeafでない場合のみ移動を許可
        if (!isLeaf(result, selectedFolder)) {
          // 同じフォルダへのドロップをチェック
          if (dragData.sourceFolder === selectedFolder) {
            alert("同じフォルダへの移動はできません");
            return;
          }

          // 複数選択されたフォルダがある場合はまとめて移動
          if (dragData.selectedFolders && dragData.selectedFolders.length > 0) {
            // 移動が無効かどうかをチェック
            if (isInvalidMove(dragData.selectedFolders, selectedFolder)) {
              alert("❌ 移動できません\n無効な移動先です");
              return;
            }

            handleMoveSelectedFolders(
              dragData.selectedFolders,
              dragData.sourceFolder || "不明",
              selectedFolder
            );
          } else {
            // 単一フォルダの移動
            // 移動が無効かどうかをチェック
            if (isInvalidMove([dragData.folderId], selectedFolder)) {
              alert("❌ 移動できません\n無効な移動先です");
              return;
            }

            // 単一フォルダの移動もAPIを呼び出す
            handleMoveSelectedFolders(
              [dragData.folderId],
              dragData.sourceFolder || "不明",
              selectedFolder
            );
          }
        } else {
          alert(
            "ドロップできません\n移動先はisLeafでないフォルダを選択してください"
          );
        }
        return;
      }

      // 画像移動の処理（既存のコード）
      const imageData = dragData;

      // 移動先のFinderに画像を追加（isLeafフォルダにのみ移動可能）
      if (
        finderType === "after" &&
        imageData.sourceType === "before" &&
        isLeaf(result, selectedFolder)
      ) {
        // 同じフォルダへのドロップをチェック
        if (imageData.sourceFolder === selectedFolder) {
          alert("同じフォルダへの移動はできません");
          return;
        }

        // 複数選択された画像がある場合はまとめて移動
        if (imageData.selectedImages && imageData.selectedImages.length > 0) {
          handleMoveSelectedImages(
            imageData.selectedImages,
            imageData.sourceFolder || "不明",
            selectedFolder
          );
        } else {
          // 単一画像の移動もAPIを呼び出す
          handleMoveSelectedImages(
            [imageData.path],
            imageData.sourceFolder || "不明",
            selectedFolder
          );
        }
      } else if (
        finderType === "after" &&
        imageData.sourceType === "before" &&
        !isLeaf(result, selectedFolder)
      ) {
        // 画像をisLeafでないフォルダにドロップしようとした場合
        alert("ドロップできません\n画像はisLeafフォルダにのみ移動できます");
      }
    } catch (error) {
      console.error("データの解析に失敗しました:", error);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    // ドラッグオーバー効果を常に有効にする（ドロップ処理で制限をかける）
    e.preventDefault();
  };

  return (
    <>
      <div
        className="dnd-finder-div-main"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {/* ヘッダー部分 */}
        <div className="dnd-finder-header">
          <div className="dnd-finder-controls">
            {finderType === "before" && !isLeaf(result, selectedFolder) ? (
              <>
                <button
                  className={`multi-select-btn ${
                    isMultiSelectMode ? "active" : ""
                  }`}
                  onClick={handleMultiSelectToggle}
                >
                  {isMultiSelectMode ? "選択モード解除" : "フォルダ選択"}
                </button>
                {isMultiSelectMode && selectedImages.length > 0 && (
                  <span className="selection-count">
                    {selectedImages.length}個選択中
                  </span>
                )}
                <div style={{ flex: 1 }}></div>
                <div className="view-mode-toggle">
                  <button
                    className={`view-mode-btn ${
                      viewMode === "list" ? "active" : ""
                    }`}
                    onClick={() => setViewMode("list")}
                  >
                    リスト
                  </button>
                  <button
                    className={`view-mode-btn ${
                      viewMode === "icon" ? "active" : ""
                    }`}
                    onClick={() => setViewMode("icon")}
                  >
                    アイコン
                  </button>
                </div>
              </>
            ) : finderType === "before" && isLeaf(result, selectedFolder) ? (
              <>
                <button
                  className={`multi-select-btn ${
                    isMultiSelectMode ? "active" : ""
                  }`}
                  onClick={handleMultiSelectToggle}
                >
                  {isMultiSelectMode ? "選択モード解除" : "まとめて選択"}
                </button>
                {isMultiSelectMode && selectedImages.length > 0 && (
                  <span className="selection-count">
                    {selectedImages.length}個選択中
                  </span>
                )}
              </>
            ) : finderType === "after" && !isLeaf(result, selectedFolder) ? (
              <>
                <button className="multi-select-btn disabled" disabled>
                  まとめて選択
                </button>
                <div style={{ flex: 1 }}></div>
                <div className="view-mode-toggle">
                  <button
                    className={`view-mode-btn ${
                      viewMode === "list" ? "active" : ""
                    }`}
                    onClick={() => setViewMode("list")}
                  >
                    リスト
                  </button>
                  <button
                    className={`view-mode-btn ${
                      viewMode === "icon" ? "active" : ""
                    }`}
                    onClick={() => setViewMode("icon")}
                  >
                    アイコン
                  </button>
                </div>
              </>
            ) : (
              <button className="multi-select-btn disabled" disabled>
                まとめて選択
              </button>
            )}
          </div>
        </div>

        <DndBreadclumbs
          parentFolders={currentFolderState.parentFolders}
          setSelectedFolder={setSelectedFolder}
          topLevelId={topLevelId || undefined}
        />
        <DndListView
          finderType={finderType}
          isLeaf={isLeaf(result, selectedFolder)}
          folders={
            isLeaf(result, selectedFolder)
              ? currentFolderState.files
              : currentFolderState.folders
          }
          originalImageFolderPath={originalImageFolderPath}
          setSelectedFolder={setSelectedFolder}
          movedImages={movedImages}
          isMultiSelectMode={isMultiSelectMode}
          selectedImages={selectedImages}
          onImageSelect={handleImageSelect}
          currentFolder={selectedFolder}
          viewMode={viewMode}
          getFolderPreviewImage={getFolderPreviewImage}
          getFolderPreviewImagePath={getFolderPreviewImagePath}
          result={result}
        />
      </div>
    </>
  );
};

export default DndFinder;
