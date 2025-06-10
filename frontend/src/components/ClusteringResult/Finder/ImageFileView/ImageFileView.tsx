import { leafData } from "../Finder";
import "./styles.modules.css";
interface imageFileViewProps {
  files: leafData;
}

const ImageFileView: React.FC<imageFileViewProps> = ({
  files,
}: imageFileViewProps) => {
  console.log(files);
  return (
    <>
      <div className="image-file-view-main">imagefileview</div>
    </>
  );
};

export default ImageFileView;
