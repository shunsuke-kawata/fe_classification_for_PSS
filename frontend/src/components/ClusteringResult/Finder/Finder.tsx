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
}

const Finder: React.FC<finderProps> = ({
  result,
  originalImageFolderPath,
}: finderProps) => {
  const topLevelId = getTopLevelFolderId(result);

  // topLevelIdがnullの場合は何も表示しない
  if (!topLevelId) {
    return <></>;
  }

  const [selectedFolder, setSelectedFolder] = useState<string>(topLevelId);
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
    console.log("=== getNodesInCurrentFolder Debug ===");
    console.log("folderId:", folderId);
    console.log("topLevelId:", topLevelId);
    console.log("path:", path);
    console.log("folders:", folders);
    console.log("files:", files);

    //現在のフォルダ情報を更新
    setCurrentFolderState({
      ...currentFolderState,
      parentFolders: path,
      folders: folders ?? [],
      files: files ?? {},
    });
  };

  useEffect(() => {
    console.log(selectedFolder);
    getNodesInCurrentFolder(selectedFolder);
    console.log(isLeaf(result, selectedFolder));
  }, [selectedFolder]);

  useEffect(() => {
    console.log(currentFolderState);
  }, [currentFolderState]);

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
