import { useEffect, useState } from "react";
import Breadclumbs from "./Breadcrumbs/Breadcrumbs";
import "./styles.modules.css";
import ListView from "./ListView/ListView";
import ImageFileView from "./ImageFileView/ImageFileView";
import {
  findPathToNode,
  getFilesInFolder,
  getFoldersInFolder,
  getTopLevelFolderId,
  isLeaf,
  leafData,
  treeNode,
} from "@/utils/result";

interface finderProps {
  originalImageFolderPath: string;
  result: {
    [topLevelNodeId: string]: treeNode;
  };
  currentFolder?: string | null;
  onCurrentFolderChange?: (currentFolderId: string) => void;
}

const Finder: React.FC<finderProps> = ({
  result,
  originalImageFolderPath,
  currentFolder,
  onCurrentFolderChange,
}: finderProps) => {
  const topLevelId = getTopLevelFolderId(result);

  // topLevelIdがnullの場合は何も表示しない
  if (!topLevelId) {
    return <></>;
  }

  // 初期フォルダを決定（currentFolderパラメータがある場合はそれを使用）
  const getInitialFolder = (): string => {
    if (currentFolder && currentFolder.length > 0) {
      return currentFolder;
    }
    return topLevelId;
  };

  const [selectedFolder, setSelectedFolder] = useState<string>(
    getInitialFolder()
  );

  // 選択された画像のパスを管理
  const [selectedImagePath, setSelectedImagePath] = useState<string>("");

  // カスタムなフォルダ変更関数（パラメータ更新を確実に実行）
  const handleFolderChange = (folderId: string) => {
    setSelectedFolder(folderId);

    // フォルダ変更をコールバックで通知
    if (onCurrentFolderChange) {
      onCurrentFolderChange(folderId);
    }
  };

  // Breadcrumbs用のラッパー関数（React.Dispatch型に対応）
  const handleBreadcrumbFolderChange = (
    value: React.SetStateAction<string>
  ) => {
    const newFolderId =
      typeof value === "function" ? value(selectedFolder) : value;
    handleFolderChange(newFolderId);
  };

  // 画像選択のハンドラー
  const handleImageSelect = (imagePath: string) => {
    console.log("=== Finder: 画像選択ハンドラー ===");
    console.log("選択された画像パス:", imagePath);
    console.log("現在のフォルダ:", selectedFolder);
    console.log("フォルダがis_leafか:", isLeaf(result, selectedFolder));
    console.log("現在のフォルダの状態:", currentFolderState);
    setSelectedImagePath(imagePath);
  };

  const [currentFolderState, setCurrentFolderState] = useState<{
    parentFolders: string[];
    files: leafData;
    folders: string[];
  }>({
    parentFolders: [topLevelId],
    files: {},
    folders: [],
  });

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

  useEffect(() => {
    getNodesInCurrentFolder(selectedFolder);
    // フォルダが変更されたら選択されている画像をリセット
    setSelectedImagePath("");
  }, [selectedFolder]);

  // 初回アクセス時にrootディレクトリをc_folderパラメータに設定
  useEffect(() => {
    // currentFolderが未設定かつonCurrentFolderChangeが利用可能な場合
    if (
      (!currentFolder || currentFolder.length === 0) &&
      onCurrentFolderChange
    ) {
      // topLevelIdをc_folderパラメータに設定
      onCurrentFolderChange(topLevelId);
    }
  }, []); // 初回のみ実行

  // currentFolderパラメータが変更された時に選択フォルダを更新
  useEffect(() => {
    const newFolder = getInitialFolder();
    if (newFolder !== selectedFolder) {
      handleFolderChange(newFolder);
    }
  }, [currentFolder]);

  useEffect(() => {
    // 状態更新の監視（デバッグ用のログを削除）
  }, [currentFolderState]);

  return (
    <>
      <div className="finder-div-main">
        <Breadclumbs
          parentFolders={currentFolderState.parentFolders}
          setSelectedFolder={handleBreadcrumbFolderChange}
          result={result}
        />
        <div className="finder-view-main">
          <ListView
            isLeaf={isLeaf(result, selectedFolder)}
            folders={
              isLeaf(result, selectedFolder)
                ? Object.values(currentFolderState.files)
                : currentFolderState.folders
            }
            setSelectedFolder={handleBreadcrumbFolderChange}
            result={result}
            onImageSelect={handleImageSelect}
            selectedImagePath={selectedImagePath}
          />
          <ImageFileView
            files={currentFolderState.files}
            originalImageFolderPath={originalImageFolderPath}
            selectedImagePath={selectedImagePath}
            onImageSelect={handleImageSelect}
          />
        </div>
      </div>
    </>
  );
};

export default Finder;
