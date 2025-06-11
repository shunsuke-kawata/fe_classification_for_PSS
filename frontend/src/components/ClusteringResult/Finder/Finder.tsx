import { useEffect, useState } from "react";
import Breadclumbs from "./Breadcrumbs/Breadcrumbs";
import "./styles.modules.css";
import ListView from "./ListView/ListView";
import ImageFileView from "./ImageFileView/ImageFileView";

interface finderProps {
  originalImageFolderPath: string;
  result: {
    [topLevelNodeId: string]: treeNode;
  };
}

export type leafData = { [imageId: string]: string };
interface treeNode {
  is_leaf: boolean;
  data: treeData;
}

type treeData = leafData | { [nodeId: string]: treeNode };

const Finder: React.FC<finderProps> = ({
  result,
  originalImageFolderPath,
}: finderProps) => {
  const [selectedFolder, setSelectedFolder] = useState<string>("top");
  const [currentFolderState, setCurrentFolderState] = useState<{
    parentFolders: string[];
    files: leafData;
    folders: string[];
  }>({
    parentFolders: [],
    files: {},
    folders: [],
  });

  function findNodeById(
    obj: { [key: string]: treeNode },
    targetId: string
  ): treeNode | undefined {
    for (const key in obj) {
      const node = obj[key];
      if (key === targetId) return node;
      if (!node.is_leaf) {
        const childData = node.data as { [key: string]: treeNode };
        const result = findNodeById(childData, targetId);
        if (result) return result;
      }
    }
    return undefined;
  }

  const isLeaf = (folderId: string): boolean => {
    if (folderId === "top") return false;
    const node = findNodeById(result, folderId);
    return node?.is_leaf ?? false;
  };

  const getFoldersInFolder = (folderId: string): string[] => {
    if (folderId === "top") {
      return Object.entries(result)
        .filter(([_, node]) => typeof node.data !== "undefined")
        .map(([key]) => key);
    }
    const node = findNodeById(result, folderId);
    if (!node) return [];

    // node.data が leafData でない（＝ treeNode の map）ならフォルダ
    const childData = node.data as { [key: string]: treeNode };
    return Object.entries(childData)
      .filter(([_, value]) => typeof value.data !== "undefined")
      .map(([key]) => key);
  };

  const getFilesInFolder = (folderId: string): { [id: string]: string } => {
    const node = findNodeById(result, folderId);
    if (!node || !node.is_leaf) return {};
    return node.data as leafData;
  };

  // 親フォルダのパス（top→親→…→target の順）
  function findPathToNode(
    obj: { [key: string]: treeNode },
    targetId: string,
    path: string[] = []
  ): string[] | undefined {
    for (const key in obj) {
      const node = obj[key];
      if (key === targetId) {
        return [...path, key]; // 修正ポイント
      }
      if (!node.is_leaf) {
        const childData = node.data as { [key: string]: treeNode };
        const result = findPathToNode(childData, targetId, [...path, key]);
        if (result) return result;
      }
    }
    return undefined;
  }

  const getNodesInCurrentFolder = (folderId: string) => {
    const folders = getFoldersInFolder(folderId);
    const files = getFilesInFolder(folderId);
    const path =
      folderId === "top" ? [] : findPathToNode(result, folderId) ?? [];

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
    console.log(isLeaf(selectedFolder));
  }, [selectedFolder]);

  return (
    <>
      <div className="finder-div-main">
        <Breadclumbs
          parentFolders={currentFolderState.parentFolders}
          setSelectedFolder={setSelectedFolder}
        />
        <div className="finder-view-main">
          <ListView
            isLeaf={isLeaf(selectedFolder)}
            folders={
              isLeaf(selectedFolder)
                ? Object.values(currentFolderState.files)
                : currentFolderState.folders
            }
            setSelectedFolder={setSelectedFolder}
          />
          <ImageFileView
            files={currentFolderState.files}
            originalImageFolderPath={originalImageFolderPath}
          />
        </div>
      </div>
    </>
  );
};

export default Finder;
