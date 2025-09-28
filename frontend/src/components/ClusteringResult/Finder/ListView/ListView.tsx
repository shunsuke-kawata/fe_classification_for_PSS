import "./styles.modules.css";
import {
  treeNode,
  getImageCountInFolder,
  isLeaf as isLeafFunction,
} from "@/utils/result";

interface listViewProps {
  isLeaf: boolean;
  folders: string[];
  setSelectedFolder: React.Dispatch<React.SetStateAction<string>>;
  result: {
    [topLevelNodeId: string]: treeNode;
  };
  onImageSelect?: (imagePath: string) => void;
  selectedImagePath?: string;
}
const ListView: React.FC<listViewProps> = ({
  isLeaf,
  folders,
  setSelectedFolder,
  result,
  onImageSelect,
  selectedImagePath,
}: listViewProps) => {
  return (
    <div className="list-view-main">
      {folders.map((foldername, idx) => {
        // 各フォルダがis_leafかどうかをチェック
        const folderIsLeaf = isLeafFunction(result, foldername);
        // is_leafのフォルダの画像枚数を取得
        const imageCount = folderIsLeaf
          ? getImageCountInFolder(result, foldername)
          : 0;

        // 画像が選択されているかチェック（is_leafの場合のみ）
        const isSelected = isLeaf && selectedImagePath === foldername;

        return (
          <div
            key={idx}
            className={`list-view-item ${
              idx % 2 === 0 ? "list-view-item-even" : "list-view-item-odd"
            } ${isSelected ? "selected" : ""}`}
            onClick={() => {
              console.log("=== ListViewアイテムがクリックされました ===");
              console.log("ファイル名:", foldername);
              console.log("isLeaf:", isLeaf);
              console.log("folderIsLeaf:", folderIsLeaf);
              console.log("onImageSelect存在:", !!onImageSelect);

              if (isLeaf) {
                // is_leafフォルダ内では、すべてのアイテムを画像として扱う
                console.log("is_leafフォルダ内のファイルをクリック");
                if (onImageSelect) {
                  console.log("画像選択処理を実行");
                  onImageSelect(foldername);
                } else {
                  console.log(
                    "画像選択処理をスキップ - onImageSelectが存在しません"
                  );
                }
              } else {
                console.log("通常フォルダをクリック - フォルダ移動処理");
                setSelectedFolder(foldername);
              }
            }}
          >
            {isLeaf ? <></> : <span className="arrow">{"＞"}</span>}
            <img
              className="img-icon"
              src={
                isLeaf
                  ? "/assets/image-file-icon.svg"
                  : "/assets/folder-icon.svg"
              }
              alt=""
            />
            <span className="folder-name-span">
              {foldername}
              {folderIsLeaf && imageCount > 0 && (
                <span className="image-count">({imageCount})</span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default ListView;
