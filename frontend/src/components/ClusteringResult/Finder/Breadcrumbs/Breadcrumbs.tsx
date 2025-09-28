import { useEffect, useState } from "react";
import "./styles.modules.css";
import { treeNode, getImageCountInFolder, isLeaf } from "@/utils/result";

interface BreadcrumbsProps {
  parentFolders: string[];
  setSelectedFolder: React.Dispatch<React.SetStateAction<string>>;
  topLevelId?: string;
  result: {
    [topLevelNodeId: string]: treeNode;
  };
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  parentFolders,
  setSelectedFolder,
  topLevelId,
  result,
}) => {
  const items = parentFolders;
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // ウィンドウリサイズを監視
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 省略が必要かどうかを判定（ウィンドウサイズと階層数に応じて）
  const shouldTruncate = () => {
    // 画面サイズを細かく分類
    const isVerySmallScreen = windowWidth <= 480; // 非常に小さい画面（スマホ縦）
    const isSmallScreen = windowWidth <= 768; // 小さい画面（スマホ横・小タブレット）
    const isMediumSmallScreen = windowWidth <= 1024 * (2 / 3); // ウィンドウの2/3程度（約683px）
    const isMediumScreen = windowWidth <= 1024; // 中程度の画面（タブレット）
    const isLargeScreen = windowWidth > 1024; // 大きい画面（デスクトップ）

    // 非常に大きい画面でも3階層以上で省略
    if (windowWidth > 1440) {
      // 3階層以上で省略
      return items.length > 2;
    }

    // 大きい画面（デスクトップ）
    if (isLargeScreen) {
      // 3階層以上で省略（より積極的に省略）
      return items.length > 2;
    }

    // 中程度の画面（タブレット）
    if (isMediumScreen && !isMediumSmallScreen) {
      // 3階層以上で省略
      return items.length > 2;
    }

    // ウィンドウの2/3程度以下（PCでブラウザサイズを小さくした場合を想定）
    if (isMediumSmallScreen && !isSmallScreen) {
      // 2階層以上で省略
      return items.length > 1;
    }

    // 小さい画面（スマホ横・小タブレット）
    if (isSmallScreen && !isVerySmallScreen) {
      // 2階層以上で省略
      return items.length > 1;
    }

    // 非常に小さい画面（スマホ縦）
    if (isVerySmallScreen) {
      // 1階層以上で省略（最も制限的）
      return items.length > 0;
    }

    return false;
  };

  // 文字列を省略する関数（前3文字 + ... + 後3文字）
  const truncateString = (str: string) => {
    if (!shouldTruncate()) {
      return str;
    }

    // 文字列が短い場合は省略しない
    if (str.length <= 9) {
      return str;
    }

    // 明示的に前3文字と後3文字を取得
    const front = str.substring(0, 3);
    const back = str.substring(str.length - 3);
    const result = front + "..." + back;

    return result;
  };

  return (
    <div className="breadcrumbs">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const displayName = truncateString(item);
        const itemIsLeaf = isLeaf(result, item);
        const imageCount = itemIsLeaf ? getImageCountInFolder(result, item) : 0;

        return (
          <span key={index} className="breadcrumb-wrapper">
            <span
              className="breadcrumb-item"
              onClick={() => setSelectedFolder(item)}
              title={item} // ホバー時に完全な名前を表示
            >
              {displayName}
              {itemIsLeaf && imageCount > 0 && (
                <span className="image-count">({imageCount})</span>
              )}
            </span>
            {!isLast && <span className="separator">＞</span>}
          </span>
        );
      })}
    </div>
  );
};

export default Breadcrumbs;
