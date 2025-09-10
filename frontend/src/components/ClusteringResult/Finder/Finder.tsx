import { useEffect, useState } from "react";
import Breadclumbs from "./Breadcrumbs/Breadcrumbs";
import "./styles.modules.css";
import ListView from "./ListView/ListView";
import ImageFileView from "./ImageFileView/ImageFileView";
import {
  findPathToNode,
  getFilesInFolder,
  getFoldersInFolder,
  isLeaf,
  leafData,
  treeNode,
} from "@/utils/result";

interface finderProps {
  originalImageFolderPath: string;
  result: {
    [topLevelNodeId: string]: treeNode;
  };
}

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
      <div className="finder-div-main">
        <Breadclumbs
          parentFolders={currentFolderState.parentFolders}
          setSelectedFolder={setSelectedFolder}
        />
        <div className="finder-view-main">
          <ListView
            isLeaf={isLeaf(result, selectedFolder)}
            folders={
              isLeaf(result, selectedFolder)
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
