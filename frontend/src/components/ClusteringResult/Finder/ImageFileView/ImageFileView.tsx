import { leafData } from "../../CluesteringResult";
import "./styles.modules.css";
import config from "@/config/config.json";
import FileThumbnail from "./FileThumbnail/FileThumbnail";
interface imageFileViewProps {
  files: leafData;
  originalImageFolderPath: string;
}

const ImageFileView: React.FC<imageFileViewProps> = ({
  files,
  originalImageFolderPath,
}: imageFileViewProps) => {
  const baseOriginalImageFolderPath = `${config.backend_base_url}/images/${originalImageFolderPath}`;
  return (
    <div className="image-file-view-main">
      {Object.entries(files).map(([key, value]) => (
        <div key={key} className="image-file-item">
          <FileThumbnail
            originalImageFilePath={`${baseOriginalImageFolderPath}/${value}`}
          />
        </div>
      ))}
    </div>
  );
};

export default ImageFileView;
