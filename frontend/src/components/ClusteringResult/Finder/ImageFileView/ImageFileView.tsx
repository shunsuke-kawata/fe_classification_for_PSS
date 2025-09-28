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
}

const ImageFileView: React.FC<imageFileViewProps> = ({
  files,
  originalImageFolderPath,
  selectedImagePath,
  onImageSelect,
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

  return (
    <div className="image-file-view-main">
      {Object.entries(files).map(([key, file]) => {
        const isSelected = selectedImagePath === file;
        return (
          <div
            key={key}
            ref={(el) => {
              imageRefs.current[file] = el;
            }}
            className={`image-file-item ${isSelected ? "selected" : ""}`}
            onClick={() => onImageSelect && onImageSelect(file)}
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
