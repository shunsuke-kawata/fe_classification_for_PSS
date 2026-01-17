import { useEffect, useState, useRef } from "react";
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
  getAllFilesFromResult,
} from "@/utils/result";

interface finderProps {
  originalImageFolderPath: string;
  result: {
    [topLevelNodeId: string]: treeNode;
  };
  currentFolder?: string | null;
  onCurrentFolderChange?: (currentFolderId: string) => void;
  mongo_result_id?: string;
  selectedClusteringCount?: number | null;
  imageClusteringCounts?: { [clustering_id: string]: number };
  isMeasuring?: boolean;
  onFolderClick?: (
    folderId: string,
    currentFolderId: string,
    source: "breadcrumb" | "list",
    isUpNavigation?: boolean
  ) => void;
  onLeafFolderOpen?: (folderId?: string) => void;
  onScroll?: (scrollTop: number) => void;
  selectedAlphabet?: string;
  onAlphabetChange?: (alphabet: string) => void;
  selectedFileName?: string | null;
  onFileNamesAvailable?: (fileNames: string[]) => void;
  onImageClickForMeasurement?: () => void;
}

const Finder: React.FC<finderProps> = ({
  result,
  originalImageFolderPath,
  currentFolder,
  onCurrentFolderChange,
  mongo_result_id,
  selectedClusteringCount,
  imageClusteringCounts,
  isMeasuring,
  onFolderClick,
  onLeafFolderOpen,
  onScroll,
  selectedAlphabet,
  onAlphabetChange,
  selectedFileName,
  onFileNamesAvailable,
  onImageClickForMeasurement,
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

  // スクロール位置を保存するMap（フォルダIDごと）
  const scrollPositions = useRef<Map<string, number>>(new Map());
  // ListViewのref
  const listViewRef = useRef<HTMLDivElement>(null);

  // カスタムなフォルダ変更関数（パラメータ更新を確実に実行）
  const handleFolderChange = (folderId: string) => {
    // 現在のスクロール位置を保存
    if (listViewRef.current) {
      scrollPositions.current.set(
        selectedFolder,
        listViewRef.current.scrollTop
      );
    }

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

  // 結果ツリー全体からクラスタリング回数に該当するファイル名を抽出して親に通知
  useEffect(() => {
    if (onFileNamesAvailable) {
      // selectedClusteringCountがnullまたはundefinedの場合は空配列を返す
      if (
        selectedClusteringCount === null ||
        selectedClusteringCount === undefined
      ) {
        onFileNamesAvailable([]);
        return;
      }

      // 全体の結果から全ファイルを取得
      const allFiles = getAllFilesFromResult(result);

      // 選択されたクラスタリング回数に該当するファイル名のみを抽出
      const filteredFileNames = Object.entries(allFiles)
        .filter(([clusteringId, fileName]) => {
          if (!imageClusteringCounts) return false;
          const imageCount = imageClusteringCounts[clusteringId];
          return imageCount === selectedClusteringCount;
        })
        .map(([clusteringId, fileName]) => fileName);

      onFileNamesAvailable(filteredFileNames);
    }
  }, [
    result,
    selectedClusteringCount,
    imageClusteringCounts,
    onFileNamesAvailable,
  ]);

  return (
    <>
      <div className="finder-div-main">
        <Breadclumbs
          parentFolders={currentFolderState.parentFolders}
          setSelectedFolder={handleBreadcrumbFolderChange}
          result={result}
          currentFolder={selectedFolder}
          isMeasuring={isMeasuring}
          onFolderClick={onFolderClick}
          selectedAlphabet={selectedAlphabet}
          onAlphabetChange={onAlphabetChange}
        />
        <div className="finder-view-main">
          <ListView
            ref={listViewRef}
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
            mongo_result_id={mongo_result_id}
            currentFolder={selectedFolder}
            isMeasuring={isMeasuring}
            onFolderClick={onFolderClick}
            onLeafFolderOpen={onLeafFolderOpen}
            onScroll={onScroll}
            scrollPosition={scrollPositions.current.get(selectedFolder) || 0}
            originalImageFolderPath={originalImageFolderPath}
          />
          <ImageFileView
            files={currentFolderState.files}
            originalImageFolderPath={originalImageFolderPath}
            selectedImagePath={selectedImagePath}
            onImageSelect={handleImageSelect}
            selectedClusteringCount={selectedClusteringCount}
            imageClusteringCounts={imageClusteringCounts}
            selectedFileName={selectedFileName}
            isMeasuring={isMeasuring}
            onImageClickForMeasurement={onImageClickForMeasurement}
          />
        </div>
      </div>
    </>
  );
};

export default Finder;
