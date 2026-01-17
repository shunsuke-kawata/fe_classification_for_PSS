import "./styles.modules.css";
import config from "@/config/config.json";
import FileThumbnail from "@/components/FileThumbnail/FileThumbnail";
import { leafData } from "@/utils/result";
import { useEffect, useRef } from "react";

interface imageFileViewProps {
  files: leafData;
  originalImageFolderPath: string;
  selectedImagePath?: string;
  onImageSelect?: (imagePath: string) => void;
  selectedClusteringCount?: number | null;
  imageClusteringCounts?: { [clustering_id: string]: number };
  selectedFileName?: string | null;
  isMeasuring?: boolean;
  onImageClickForMeasurement?: () => void;
}

const ImageFileView: React.FC<imageFileViewProps> = ({
  files,
  originalImageFolderPath,
  selectedImagePath,
  onImageSelect,
  selectedClusteringCount,
  imageClusteringCounts,
  selectedFileName,
  isMeasuring,
  onImageClickForMeasurement,
}: imageFileViewProps) => {
  const baseOriginalImageFolderPath = `${config.backend_base_url}/images/${originalImageFolderPath}`;
  const imageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // 選択された画像にスクロールする
  useEffect(() => {
    if (selectedImagePath && imageRefs.current[selectedImagePath]) {
      const element = imageRefs.current[selectedImagePath];
      element?.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    }
  }, [selectedImagePath]);

  // クラスタリング回数に基づいて画像を表示するかどうかを判定
  const shouldShowImage = (clusteringId: string): boolean => {
    // 表示/非表示のフィルタは行わず、常に画像を表示する（ハイライトのみ適用する）
    return true;
  };

  // クラスタリング回数に基づいて枠線スタイルを取得（選択画像に赤い太線を適用）
  const getBorderStyle = (clusteringId: string, fileName: string): string => {
    // 1つ目のプルダウンが「全て」の場合はハイライトなし
    if (
      selectedClusteringCount === null ||
      selectedClusteringCount === undefined
    ) {
      return "none";
    }

    // クラスタリング回数に該当するかチェック
    const matchesClusteringCount = imageClusteringCounts
      ? imageClusteringCounts[clusteringId] === selectedClusteringCount
      : false;

    // 2つ目のプルダウンで特定のファイル名が選択されている場合
    if (selectedFileName) {
      // そのファイル名のみをハイライト
      if (fileName === selectedFileName) {
        return "4px solid #FF0000"; // 赤色
      }
      return "none";
    }

    // 2つ目のプルダウンが「全て」の場合
    // 1つ目の条件に該当する全てのファイルをハイライト
    if (matchesClusteringCount) {
      return "4px solid #FF0000"; // 赤色
    }

    return "none";
  };

  return (
    <div className="image-file-view-main">
      {Object.entries(files).map(([clusteringId, file]) => {
        const isSelected = selectedImagePath === file;
        const shouldShow = shouldShowImage(clusteringId);
        const borderStyle = getBorderStyle(clusteringId, file);

        // すべての画像は表示する。選択された回のみ赤い太線の枠でハイライトする
        return (
          <div
            key={clusteringId}
            ref={(el) => {
              imageRefs.current[file] = el;
            }}
            className={`image-file-item ${isSelected ? "selected" : ""}`}
            onClick={() => {
              console.log("画像クリック:", {
                file,
                selectedFileName,
                isMeasuring,
                match: file === selectedFileName,
              });
              // 計測中かつファイル名が選択されている場合、計測終了を呼び出す
              if (
                isMeasuring &&
                selectedFileName &&
                file === selectedFileName
              ) {
                console.log("計測終了ハンドラーを呼び出します");
                onImageClickForMeasurement && onImageClickForMeasurement();
              }
              onImageSelect && onImageSelect(file);
            }}
            style={{
              border: borderStyle,
              transition: "border 0.2s ease",
            }}
          >
            <FileThumbnail
              imagePath={`${baseOriginalImageFolderPath}/${file}`}
            />
          </div>
        );
      })}
    </div>
  );
};

export default ImageFileView;
