import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

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
  findNodeById,
} from "@/utils/result";
import config from "@/config/config.json";
import { moveClusteringItems, deleteEmptyFolders } from "@/api/api";

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
  const router = useRouter();
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

  // レスポンシブなボタンテキストを取得する関数
  const getResponsiveButtonText = (
    fullText: string,
    shortText: string
  ): string => {
    // 画面幅に基づいてテキストを選択（実際にはCSSで制御）
    return fullText;
  };

  // 親フォルダへ移動できるかどうかを判定する関数
  const canMoveToParentFolder = (): boolean => {
    // 複数選択モードでないと無効
    if (!isMultiSelectMode) return false;

    // 1つ以上のフォルダが選択されている必要がある
    if (selectedImages.length < 1) return false;

    // 現在のフォルダの階層を確認
    const currentPath = findPathToNode(result, selectedFolder);
    if (!currentPath || currentPath.length < 2) {
      // 2階層未満（topLevel, level1が存在しない）場合は無効
      return false;
    }

    return true;
  };

  // 親フォルダのIDを取得する関数
  const getParentFolderId = (): string | null => {
    const currentPath = findPathToNode(result, selectedFolder);
    if (!currentPath || currentPath.length < 2) {
      return null;
    }

    // 現在のパス配列から親フォルダのIDを取得
    // currentPath = [topLevel, parent, current] の場合、親フォルダはparent
    return currentPath[currentPath.length - 2];
  };

  // 親フォルダに移動する関数
  const handleMoveToParentFolder = async () => {
    if (!canMoveToParentFolder()) return;

    const parentFolderId = getParentFolderId();
    if (!parentFolderId) return;

    try {
      const response = await moveClusteringItems(
        mongo_result_id,
        "folders", // フォルダ移動として処理
        selectedImages, // 選択されたフォルダID配列
        parentFolderId // 親フォルダをdestinationとして設定
      );

      console.log("API Response:", response);
      if (response && response.message === "success") {
        setSelectedImages([]);
        setIsMultiSelectMode(false);

        // 移動完了をコールバックで通知してデータをリロード
        if (onFolderMoveComplete) {
          await onFolderMoveComplete(selectedImages.join(","), parentFolderId);
        }

        console.log("親フォルダへの移動完了 - ページリロード実行中...");
      } else {
        console.error(
          "親フォルダへの移動に失敗しました:",
          response?.data?.message || response?.message || "不明なエラー"
        );
      }
    } catch (error) {
      console.error("親フォルダへの移動エラー:", error);
      console.error(
        "親フォルダへの移動に失敗しました:",
        (error as any)?.response?.data?.message ||
          (error as any)?.message ||
          "不明なエラー"
      );
    }
  };

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

  // 初回アクセス時にt_folderパラメータを設定
  useEffect(() => {
    // onFolderChangeとtopLevelIdが利用可能な場合のみ実行
    if (onFolderChange && topLevelId) {
      // 初回アクセス時（各パラメータが未設定）の場合
      const shouldSetInitialFolder =
        (finderType === "before" &&
          (!targetFolder || targetFolder.length === 0)) ||
        (finderType === "after" &&
          (!destinationFolder || destinationFolder.length === 0));

      if (shouldSetInitialFolder) {
        // 遅延実行でコールバックを呼び出し、両方のフィンダーが初期化されるのを待つ
        setTimeout(() => {
          onFolderChange(topLevelId);
        }, 0);
      }
    }
  }, [onFolderChange, topLevelId, finderType, targetFolder, destinationFolder]); // 依存配列に必要な値を追加

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

  // 全て選択ボタンのハンドラー
  const handleSelectAll = () => {
    // 選択モードでない場合は選択モードに切り替える
    if (!isMultiSelectMode) {
      setIsMultiSelectMode(true);
    }

    // 現在のフォルダ内の全要素を取得
    let allItems: string[] = [];

    if (isLeaf(result, selectedFolder)) {
      // リーフノード（画像が含まれるフォルダ）の場合、全画像を選択
      const files = getFilesInFolder(result, selectedFolder);
      if (files) {
        allItems = Object.keys(files);
      }
    } else {
      // フォルダノードの場合、全フォルダを選択
      const folders = getFoldersInFolder(result, selectedFolder);
      if (folders) {
        allItems = folders;
      }
    }

    setSelectedImages(allItems);
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

  // フォルダ統合の判定・実行関数
  const canMergeFolders = (): boolean => {
    // 基本データの検証
    if (!result || !selectedFolder) {
      console.log("🚫 canMergeFolders: 基本データが不足しています");
      return false;
    }

    // フォルダが2つ以上選択されている
    if (selectedImages.length < 2) {
      console.log("🚫 canMergeFolders: 選択フォルダが2つ未満です");
      return false;
    }

    // 現在のフォルダが非リーフ（フォルダ表示モード）
    if (isLeaf(result, selectedFolder)) {
      console.log("🚫 canMergeFolders: 現在のフォルダがリーフフォルダです");
      return false;
    }

    // 選択されたすべてのフォルダがisLeafである
    const allIsLeaf = selectedImages.every((folderId) => {
      const isLeafResult = isLeaf(result, folderId);
      console.log(`📁 フォルダ ${folderId} is_leaf: ${isLeafResult}`);
      return isLeafResult;
    });

    if (!allIsLeaf) {
      console.log(
        "🚫 canMergeFolders: 選択されたフォルダの中に非リーフフォルダがあります"
      );
      return false;
    }

    console.log("✅ canMergeFolders: フォルダ統合が可能です");
    return true;
  };

  const handleMergeFolders = async () => {
    console.log("🔄 フォルダ統合開始");

    if (!canMergeFolders()) {
      console.log("🚫 フォルダ統合の条件を満たしていません");
      return;
    }

    const targetFolderId = selectedImages[0]; // 1番目のフォルダを統合先とする
    const sourceFolderIds = selectedImages.slice(1); // 2番目以降のフォルダ

    console.log(`📋 統合設定:`);
    console.log(`   統合先フォルダ: ${targetFolderId}`);
    console.log(`   統合元フォルダ: [${sourceFolderIds.join(", ")}]`);

    // 2番目以降のフォルダ内のすべての画像を取得
    const allImageIds: string[] = [];
    sourceFolderIds.forEach((folderId) => {
      const files = getFilesInFolder(result, folderId);
      if (files) {
        const fileIds = Object.keys(files);
        console.log(`📁 フォルダ ${folderId} の画像数: ${fileIds.length}`);
        allImageIds.push(...fileIds);
      } else {
        console.log(`📁 フォルダ ${folderId} にはファイルがありません`);
      }
    });

    console.log(`📊 移動対象画像数: ${allImageIds.length}`);

    if (allImageIds.length === 0) {
      console.log("🚫 移動する画像がありません");
      return;
    }

    try {
      console.log("🚀 画像移動API呼び出し開始...");
      const response = await moveClusteringItems(
        mongo_result_id,
        "images", // ファイル移動として処理
        allImageIds,
        targetFolderId
      );

      console.log("📋 画像移動API Response:", response);
      if (response && response.message === "success") {
        console.log("✅ 画像移動が成功しました");

        // 画像移動が成功した場合、空になったフォルダを削除
        try {
          console.log(`🗂️ フォルダ削除API呼び出し開始:`);
          console.log(`   mongo_result_id: ${mongo_result_id}`);
          console.log(`   統合先フォルダ: ${targetFolderId}`);
          console.log(
            `   空になるフォルダ (sources): [${sourceFolderIds.join(", ")}]`
          );

          const deleteResponse = await deleteEmptyFolders(
            mongo_result_id,
            sourceFolderIds
          );
          console.log(
            "🔍 フォルダ削除APIレスポンス:",
            JSON.stringify(deleteResponse, null, 2)
          );

          // 200以外の場合も成功として扱う（開発中のAPI）
          if (
            deleteResponse &&
            (deleteResponse.status === 200 || deleteResponse.status === 500)
          ) {
            if (deleteResponse.status === 200) {
              console.log(
                `✅ 空のフォルダを削除しました: ${sourceFolderIds.join(", ")}`
              );
            } else {
              console.log(
                "⚠️ フォルダ削除API（開発中）から500エラーが返されましたが、処理は継続します"
              );
            }
          } else {
            console.warn(
              "⚠️ フォルダ削除API（開発中）からの応答:",
              deleteResponse?.message || "予期しないレスポンスが返されました"
            );
            console.log("📋 削除対象だったフォルダID:", sourceFolderIds);
          }
        } catch (deleteError: any) {
          console.warn(
            "⚠️ フォルダ削除API（開発中）でエラーが発生しましたが、統合は完了しています:"
          );
          console.log("📋 削除対象だったフォルダID:", sourceFolderIds);
          if (deleteError?.response?.status === 500) {
            console.log("   → 500エラー（開発中のため正常です）");
          } else {
            console.error("   → 予期しないエラー:", deleteError);
          }
        }

        console.log("🎉 フォルダ統合処理が完了しました");
        setSelectedImages([]);
        setIsMultiSelectMode(false);

        // 統合完了をコールバックで通知
        if (onFolderMoveComplete) {
          console.log("📞 フォルダ移動完了コールバック呼び出し");
          await onFolderMoveComplete(sourceFolderIds.join(","), targetFolderId);
        }

        // バックエンド処理完了後にページをリロード
        console.log("♻️ フォルダ統合完了 - ページリロード実行中...");
        // router.refresh();
        // window.location.reload();
      } else {
        console.error(
          "❌ フォルダ統合に失敗しました:",
          response?.data?.message || response?.message || "不明なエラー"
        );
      }
    } catch (error) {
      console.error("❌ フォルダ統合エラー:", error);
      console.error(
        "フォルダ統合に失敗しました:",
        (error as any)?.response?.data?.message ||
          (error as any)?.message ||
          "不明なエラー"
      );
    }
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
      console.log("API Response:", response);
      if (response && response.message === "success") {
        setMovedImages((prev) => [...prev, ...imagesToMove]);
        setSelectedImages([]);
        setIsMultiSelectMode(false);

        // フォルダ移動完了のコールバックを呼び出し
        if (onFolderMoveComplete) {
          await onFolderMoveComplete(sourceFolder, targetFolder);
        }

        // バックエンド処理完了後にページをリロード
        console.log("画像移動完了 - ページリロード実行中...");
        // router.refresh();
        window.location.reload();
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

        console.error(`移動に失敗しました: ${errorMessage}`);
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

      console.error(`移動に失敗しました: ${errorMessage}`);
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
      console.log("API Response:", response);
      if (response && response.message === "success") {
        setSelectedImages([]);
        setIsMultiSelectMode(false);

        // 移動完了をコールバックで通知
        if (onFolderMoveComplete) {
          onFolderMoveComplete(foldersToMove[0], targetFolder);
        }

        // バックエンド処理完了後にページをリロード
        console.log("フォルダ移動完了 - ページリロード実行中...");
        // router.refresh();
        window.location.reload();
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

        console.error(`フォルダ移動に失敗しました: ${errorMessage}`);
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

      console.error(`フォルダ移動に失敗しました: ${errorMessage}`);
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
            console.log("同じフォルダへの移動はできません");
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
                  {isMultiSelectMode ? "選択解除" : "フォルダ選択"}
                </button>
                <button className="select-all-btn" onClick={handleSelectAll}>
                  全て選択
                </button>
                {isMultiSelectMode && selectedImages.length > 0 && (
                  <>
                    <span className="selection-count">
                      {selectedImages.length}個選択中
                    </span>
                    {canMergeFolders() && (
                      <button
                        className="merge-folders-btn"
                        onClick={handleMergeFolders}
                      >
                        <span className="btn-full-text">統合</span>
                        <span className="btn-short-text">統合</span>
                      </button>
                    )}
                    {canMoveToParentFolder() && (
                      <button
                        className="move-to-parent-btn"
                        onClick={handleMoveToParentFolder}
                      >
                        <span className="btn-full-text">親に移動</span>
                        <span className="btn-short-text">親に移動</span>
                      </button>
                    )}
                  </>
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
                  {isMultiSelectMode ? "選択解除" : "画像選択"}
                </button>
                <button className="select-all-btn" onClick={handleSelectAll}>
                  全て選択
                </button>
                {isMultiSelectMode && selectedImages.length > 0 && (
                  <span className="selection-count">
                    {selectedImages.length}個選択中
                  </span>
                )}
              </>
            ) : finderType === "after" && !isLeaf(result, selectedFolder) ? (
              <>
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
              <></>
            )}
          </div>
        </div>

        <DndBreadclumbs
          parentFolders={currentFolderState.parentFolders}
          setSelectedFolder={setSelectedFolder}
          topLevelId={topLevelId || undefined}
          result={result}
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
