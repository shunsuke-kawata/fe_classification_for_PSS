export type leafData = { [imageId: string]: string };
export interface treeNode {
  is_leaf: boolean;
  data: treeData;
  parent_id: string | null;
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
// 全体フォルダのIDを取得する関数
export const getTopLevelFolderId = (result: {
  [topLevelNodeId: string]: treeNode;
}): string | null => {
  // 全体フォルダは parent_id が null のフォルダ
  for (const [key, node] of Object.entries(result)) {
    if (node.parent_id === null && !node.is_leaf) {
      return key;
    }
  }
  return null;
};

export const isLeaf = (
  result: {
    [topLevelNodeId: string]: treeNode;
  },
  folderId: string
): boolean => {
  const topLevelId = getTopLevelFolderId(result);
  if (folderId === topLevelId) return false;
  const node = findNodeById(result, folderId);
  return node?.is_leaf ?? false;
};

export const getFoldersInFolder = (
  result: {
    [topLevelNodeId: string]: treeNode;
  },
  folderId: string
): string[] => {
  const topLevelId = getTopLevelFolderId(result);
  if (folderId === topLevelId) {
    // 全体フォルダ内のフォルダを取得
    if (topLevelId) {
      const topNode = findNodeById(result, topLevelId);
      if (topNode && !topNode.is_leaf) {
        const childData = topNode.data as { [key: string]: treeNode };
        return Object.entries(childData)
          .filter(([_, value]) => typeof value.data !== "undefined")
          .map(([key]) => key);
      }
    }
    return [];
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

// 親フォルダのパス（全体フォルダIDを最初に含める）
export const findPathToNode = (
  obj: { [key: string]: treeNode },
  targetId: string,
  path: string[] = []
): string[] | undefined => {
  const topLevelId = getTopLevelFolderId(obj);

  for (const key in obj) {
    const node = obj[key];

    if (key === targetId) {
      // 全体フォルダIDの場合はtopLevelIdのみの配列を返す
      if (key === topLevelId) {
        return [topLevelId];
      }
      return [...path, key];
    }
    if (!node.is_leaf) {
      const childData = node.data as { [key: string]: treeNode };
      // 全体フォルダIDの場合は、その子要素から検索を開始
      const searchPath = key === topLevelId ? [] : [...path, key];
      const result = findPathToNode(childData, targetId, searchPath);
      if (result !== undefined) {
        // 全体フォルダIDの子要素が見つかった場合の処理
        if (key === topLevelId) {
          // 全体フォルダIDの子要素が見つかった場合、常にtopLevelIdを最初に追加
          return topLevelId ? [topLevelId, ...result] : result;
        }
        return result;
      }
    }
  }
  return undefined;
};
