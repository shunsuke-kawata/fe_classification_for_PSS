export type leafData = { [imageId: string]: string };
export interface treeNode {
  is_leaf: boolean;
  data: treeData;
  parent_id: string | null;
  name?: string;
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

// フォルダ内の画像枚数を取得する関数
export const getImageCountInFolder = (
  result: {
    [topLevelNodeId: string]: treeNode;
  },
  folderId: string
): number => {
  const node = findNodeById(result, folderId);
  if (!node || !node.is_leaf) return 0;

  const files = node.data as leafData;
  return Object.keys(files).length;
};

// フォルダ名（name）を取得する関数
export const getFolderName = (
  result: {
    [topLevelNodeId: string]: treeNode;
  },
  folderId: string
): string => {
  const node = findNodeById(result, folderId);
  return node?.name || folderId; // nameが存在しない場合はidをフォールバック
};

// 結果ツリー全体から全ファイルを取得する関数
export const getAllFilesFromResult = (result: {
  [topLevelNodeId: string]: treeNode;
}): { [clusteringId: string]: string } => {
  const allFiles: { [clusteringId: string]: string } = {};

  const traverseNode = (node: treeNode) => {
    if (node.is_leaf) {
      // リーフノードの場合、ファイルを収集
      const files = node.data as leafData;
      Object.assign(allFiles, files);
    } else {
      // 非リーフノードの場合、子ノードを再帰的に探索
      const children = node.data as { [key: string]: treeNode };
      Object.values(children).forEach(traverseNode);
    }
  };

  // 全トップレベルノードから探索開始
  Object.values(result).forEach(traverseNode);

  return allFiles;
};
