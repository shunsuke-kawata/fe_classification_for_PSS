import "./styles.modules.css";

interface fileThumbnailProps {
  originalImageFilePath: string;
}
const FileThumbnail: React.FC<fileThumbnailProps> = ({
  originalImageFilePath,
}: fileThumbnailProps) => {
  return (
    <div className="file-thumbnail-div">
      <img className="image-thumb" src={originalImageFilePath} alt="" />
    </div>
  );
};

export default FileThumbnail;
