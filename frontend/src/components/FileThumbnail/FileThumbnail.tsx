import "./styles.modules.css";

interface FileThumbnailProps {
  imagePath: string;
  width?: number;
  height?: number;
  padding?: number;
}

const FileThumbnail: React.FC<FileThumbnailProps> = ({
  imagePath,
  width = 150,
  height = 150,
  padding = 2,
}: FileThumbnailProps) => {
  return (
    <div
      className="file-thumbnail-div"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        padding: `${padding}px`,
      }}
    >
      <img className="image-thumb" src={imagePath} alt="" />
    </div>
  );
};

export default FileThumbnail;
