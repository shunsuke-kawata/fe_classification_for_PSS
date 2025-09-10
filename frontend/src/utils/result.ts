export type leafData = { [imageId: string]: string };
export interface treeNode {
  is_leaf: boolean;
  data: treeData;
}

export type treeData = leafData | { [nodeId: string]: treeNode };
// 最上位のレスポンス全体
export interface clusteringResultType {
  _id: string;
  mongo_result_id: string;
  result: {
    [topLevelNodeId: string]: treeNode;
  };
}

export const findNodeById = (
  obj: { [key: string]: treeNode },
  targetId: string
): treeNode | undefined => {
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
};

export const isLeaf = (
  result: {
    [topLevelNodeId: string]: treeNode;
  },
  folderId: string
): boolean => {
  if (folderId === "top") return false;
  const node = findNodeById(result, folderId);
  return node?.is_leaf ?? false;
};

export const getFoldersInFolder = (
  result: {
    [topLevelNodeId: string]: treeNode;
  },
  folderId: string
): string[] => {
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

export const getFilesInFolder = (
  result: {
    [topLevelNodeId: string]: treeNode;
  },
  folderId: string
): { [id: string]: string } => {
  const node = findNodeById(result, folderId);
  if (!node || !node.is_leaf) return {};
  return node.data as leafData;
};

// 親フォルダのパス（top→親→…→target の順）
export const findPathToNode = (
  obj: { [key: string]: treeNode },
  targetId: string,
  path: string[] = []
): string[] | undefined => {
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
};
