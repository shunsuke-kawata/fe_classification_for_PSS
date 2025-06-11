import { leafData } from "../Finder";
import "./styles.modules.css";
import config from "@/config/config.json";
interface imageFileViewProps {
  files: leafData;
}

const ImageFileView: React.FC<imageFileViewProps> = ({
  files,
}: imageFileViewProps) => {
  console.log(files);
  return (
    <div className="image-file-view-main">
      {Object.entries(files).map(([key, value]) => (
        <div key={key} className="image-file-item">
          {/* <img src={`${}`} alt="" /> */}
        </div>
      ))}
    </div>
  );
};

export default ImageFileView;
