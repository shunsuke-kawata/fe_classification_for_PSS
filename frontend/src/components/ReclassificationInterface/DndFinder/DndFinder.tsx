import { useEffect, useState } from "react";

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
};

const DndFinder: React.FC<dndFinderProps> = ({
  finderType,
  result,
  originalImageFolderPath,
  mongo_result_id,
}: dndFinderProps) => {
  const topLevelId = getTopLevelFolderId(result);
  const [selectedFolder, setSelectedFolder] = useState<string>(
    topLevelId || ""
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
    console.log(`フォルダ ${folderName} の画像を取得中...`);
    console.log(`現在のresult構造:`, result);

    const folderFiles = getFilesInFolder(result, folderName);
    console.log(`フォルダ ${folderName} のファイル一覧:`, folderFiles);

    if (folderFiles && Object.keys(folderFiles).length > 0) {
      const firstImage = Object.values(folderFiles)[0];
      console.log(`選択された最初の画像:`, firstImage);
      return firstImage;
    }

    // フォルダが見つからない場合、フォルダ名をそのまま使用
    console.log(
      `フォルダ ${folderName} に画像が見つからないため、フォルダ名をそのまま使用`
    );
    return folderName;
  };

  const getFolderPreviewImagePath = (folderName: string): string | null => {
    // フォルダ内の画像を取得してフルパスを生成
    const previewImage = getFolderPreviewImage(folderName);
    console.log(`フォルダ ${folderName} のプレビュー画像:`, previewImage);
    console.log(`originalImageFolderPath:`, originalImageFolderPath);
    console.log(`config.backend_base_url:`, config.backend_base_url);

    if (previewImage) {
      // 提供された例の形式: http://localhost:8008/images/jUL6JBa4RROGhBWv-_Ixpw/object_camera0_20241212_225845_x545_y552_1.png
      // 拡張子がない場合は .png を追加
      const imageFileName = previewImage.includes(".")
        ? previewImage
        : `${previewImage}.png`;
      const fullPath = `${config.backend_base_url}/images/${originalImageFolderPath}/${imageFileName}`;
      console.log(`生成された画像パス:`, fullPath);
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
      console.log("警告: 移動先が移動したいフォルダ一覧に含まれています");
      return true;
    }

    // 判定基準2: 移動先のフォルダの親フォルダ一覧に移動したいフォルダに含まれているフォルダがないか
    const targetPath = findPathToNode(result, targetFolder);
    if (targetPath) {
      for (const folderToMove of foldersToMove) {
        if (targetPath.includes(folderToMove)) {
          console.log(
            `警告: 移動先の親フォルダに移動したいフォルダ "${folderToMove}" が含まれています`
          );
          return true;
        }
      }
    }

    return false;
  };

  useEffect(() => {
    getNodesInCurrentFolder(selectedFolder);
    console.log(isLeaf(result, selectedFolder));
    // フォルダが変わったら選択状態をリセット
    setSelectedImages([]);
    setIsMultiSelectMode(false);
  }, [selectedFolder]);

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

      console.log("=== 画像移動API呼び出し開始 ===");
      console.log("mongo_result_id:", mongo_result_id);
      console.log("source_type: images");
      console.log("sources:", sources);
      console.log("destination_folder:", targetFolder);
      console.log("destination_folder type:", typeof targetFolder);
      console.log("destination_folder length:", targetFolder?.length);

      // 利用可能なフォルダ一覧を表示
      const availableFolders = getFoldersInFolder(result, topLevelId);
      console.log("利用可能なフォルダ一覧:", availableFolders);

      const response = await moveClusteringItems(
        mongo_result_id,
        "images",
        sources,
        targetFolder
      );

      console.log("=== APIレスポンス ===");
      console.log("response:", response);
      console.log("response.status:", response?.status);
      console.log("response.data:", response?.data);

      // レスポンスの構造を確認
      if (
        response &&
        (response.status === 200 || response.statusCode === 200)
      ) {
        setMovedImages((prev) => [...prev, ...imagesToMove]);
        setSelectedImages([]);
        setIsMultiSelectMode(false);

        console.log(
          `✅ まとめて移動成功: ${imagesToMove.length}個の画像を移動しました`
        );
        console.log(`移動元フォルダ: ${sourceFolder}`);
        console.log(`移動先フォルダ: ${targetFolder}`);
        console.log(`移動された画像: ${imagesToMove.join(", ")}`);

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
      console.error("error.message:", error?.message);
      console.error("error.response:", error?.response);
      console.error("error.response?.data:", error?.response?.data);
      console.error("error.response?.status:", error?.response?.status);

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
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

      console.log("=== フォルダ移動API呼び出し開始 ===");
      console.log("mongo_result_id:", mongo_result_id);
      console.log("source_type: folders");
      console.log("sources:", sources);
      console.log("destination_folder:", targetFolder);
      console.log("destination_folder type:", typeof targetFolder);
      console.log("destination_folder length:", targetFolder?.length);

      // 利用可能なフォルダ一覧を表示
      const availableFolders = getFoldersInFolder(result, topLevelId);
      console.log("利用可能なフォルダ一覧:", availableFolders);

      const response = await moveClusteringItems(
        mongo_result_id,
        "folders",
        sources,
        targetFolder
      );

      console.log("=== APIレスポンス ===");
      console.log("response:", response);
      console.log("response.status:", response?.status);
      console.log("response.data:", response?.data);

      // レスポンスの構造を確認
      if (
        response &&
        (response.status === 200 || response.statusCode === 200)
      ) {
        setSelectedImages([]);
        setIsMultiSelectMode(false);

        console.log("移動先のフォルダ:", targetFolder);
        console.log("移動したフォルダ一覧:", foldersToMove);

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
      console.error("error.message:", error?.message);
      console.error("error.response:", error?.response);
      console.error("error.response?.data:", error?.response?.data);
      console.error("error.response?.status:", error?.response?.status);

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "不明なエラーが発生しました";

      alert(`❌ フォルダ移動に失敗しました\n${errorMessage}`);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    // デバッグ用: すべてのドロップを許可
    console.log("ドロップイベント発生:", finderType, selectedFolder);

    const data = e.dataTransfer.getData("text/plain");
    console.log("受け取ったデータ:", data);

    if (!data) {
      console.error("ドロップされたデータが空です");
      return;
    }

    try {
      const dragData = JSON.parse(data);
      console.log("ドラッグデータ:", dragData);

      // フォルダ移動の処理
      if (dragData.type === "folder") {
        // フォルダ移動: 移動先のフォルダがisLeafでない場合のみ移動を許可
        console.log("フォルダ移動処理開始");
        if (!isLeaf(result, selectedFolder)) {
          // 同じフォルダへのドロップをチェック
          if (dragData.sourceFolder === selectedFolder) {
            console.log("同じフォルダへのドロップは無効です");
            alert("同じフォルダへの移動はできません");
            return;
          }

          // 複数選択されたフォルダがある場合はまとめて移動
          if (dragData.selectedFolders && dragData.selectedFolders.length > 0) {
            // 移動が無効かどうかをチェック
            if (isInvalidMove(dragData.selectedFolders, selectedFolder)) {
              console.log("警告: 無効な移動です");
              alert("❌ 移動できません\n無効な移動先です");
              return;
            }

            console.log(
              "📋 ドラッグされたフォルダ一覧:",
              dragData.selectedFolders
            );
            console.log(
              `📁 移動元フォルダ: ${dragData.sourceFolder || "不明"}`
            );
            console.log(`📁 移動先フォルダ: ${selectedFolder}`);
            console.log(`🔄 移動方向: ${dragData.sourceType} → ${finderType}`);
            handleMoveSelectedFolders(
              dragData.selectedFolders,
              dragData.sourceFolder || "不明",
              selectedFolder
            );
          } else {
            // 単一フォルダの移動
            // 移動が無効かどうかをチェック
            if (isInvalidMove([dragData.folderId], selectedFolder)) {
              console.log("警告: 無効な移動です");
              alert("❌ 移動できません\n無効な移動先です");
              return;
            }

            console.log("移動先のフォルダ:", selectedFolder);
            console.log("移動したフォルダ一覧:", [dragData.folderId]);

            // 単一フォルダの移動もAPIを呼び出す
            handleMoveSelectedFolders(
              [dragData.folderId],
              dragData.sourceFolder || "不明",
              selectedFolder
            );
          }
        } else {
          console.log("ドロップ無効: 移動先がisLeafフォルダのため");
          alert(
            "ドロップできません\n移動先はisLeafでないフォルダを選択してください"
          );
        }
        return;
      }

      // 画像移動の処理（既存のコード）
      const imageData = dragData;
      console.log(
        `Image moved: ${imageData.path} from ${imageData.sourceType} to ${finderType}`
      );

      // 移動先のFinderに画像を追加（isLeafフォルダにのみ移動可能）
      if (
        finderType === "after" &&
        imageData.sourceType === "before" &&
        isLeaf(result, selectedFolder)
      ) {
        // 同じフォルダへのドロップをチェック
        if (imageData.sourceFolder === selectedFolder) {
          console.log("同じフォルダへのドロップは無効です");
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
        console.log("ドロップ無効: 画像はisLeafフォルダにのみ移動可能");
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

  useEffect(() => {
    console.log("current--------------", currentFolderState);
  }, [currentFolderState]);

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
          topLevelId={topLevelId}
        />
        <DndListView
          finderType={finderType}
          isLeaf={isLeaf(result, selectedFolder)}
          folders={
            isLeaf(result, selectedFolder)
              ? Object.values(currentFolderState.files)
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
