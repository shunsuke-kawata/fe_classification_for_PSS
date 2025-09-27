import { useEffect, useState } from "react";
import "./styles.modules.css";

interface BreadcrumbsProps {
  parentFolders: string[];
  setSelectedFolder: React.Dispatch<React.SetStateAction<string>>;
  topLevelId?: string;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  parentFolders,
  setSelectedFolder,
  topLevelId,
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

  // 省略が必要かどうかを判定
  const shouldTruncate = () => {
    // 階層が3以下の場合は省略しない
    if (items.length <= 3) {
      return false;
    }

    // ウィンドウ幅が大きい場合は省略しない（デスクトップ）
    if (windowWidth >= 1024) {
      return false;
    }

    return true;
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

        return (
          <span key={index} className="breadcrumb-wrapper">
            <span
              className="breadcrumb-item"
              onClick={() => setSelectedFolder(item)}
              title={item} // ホバー時に完全な名前を表示
            >
              {displayName}
            </span>
            {!isLast && <span className="separator">＞</span>}
          </span>
        );
      })}
    </div>
  );
};

export default Breadcrumbs;
