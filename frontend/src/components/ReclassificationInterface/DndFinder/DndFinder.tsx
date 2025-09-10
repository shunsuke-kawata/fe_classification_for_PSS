import { original } from "@reduxjs/toolkit";

import { SetStateAction, useEffect, useState } from "react";

import DndBreadclumbs from "./DndBreadclumbs/DndBreadclumbs";
import DndListView from "./DndListView/DndListView";
import "./styles.modules.css";
import {
  findPathToNode,
  getFilesInFolder,
  getFoldersInFolder,
  isLeaf,
  leafData,
  treeNode,
} from "@/utils/result";

type dndFinderProps = {
  originalImageFolderPath: string;
  result: {
    [topLevelNodeId: string]: treeNode;
  };
};

const DndFinder: React.FC<dndFinderProps> = ({
  result,
  originalImageFolderPath,
}: dndFinderProps) => {
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

  const getNodesInCurrentFolder = (folderId: string) => {
    const folders = getFoldersInFolder(result, folderId);
    const files = getFilesInFolder(result, folderId);
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
    console.log(isLeaf(result, selectedFolder));
  }, [selectedFolder]);
  return (
    <>
      <div className="dnd-finder-div-main">
        <DndBreadclumbs
          parentFolders={currentFolderState.parentFolders}
          setSelectedFolder={setSelectedFolder}
        />
        <DndListView
          isLeaf={isLeaf(result, selectedFolder)}
          folders={
            isLeaf(result, selectedFolder)
              ? Object.values(currentFolderState.files)
              : currentFolderState.folders
          }
          originalImageFolderPath={originalImageFolderPath}
          setSelectedFolder={setSelectedFolder}
        />
      </div>
    </>
  );
};

export default DndFinder;
