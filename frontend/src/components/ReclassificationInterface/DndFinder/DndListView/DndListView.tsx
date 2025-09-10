import "./styles.modules.css";
import config from "@/config/config.json";
import FileThumbnail from "@/components/FileThumbnail/FileThumbnail";

interface dndListViewProps {
  isLeaf: boolean;
  folders: string[];
  originalImageFolderPath: string;
  setSelectedFolder: React.Dispatch<React.SetStateAction<string>>;
}
const DndListView: React.FC<dndListViewProps> = ({
  isLeaf,
  folders,
  originalImageFolderPath,
  setSelectedFolder,
}: dndListViewProps) => {
  const baseOriginalImageFolderPath = `${config.backend_base_url}/images/${originalImageFolderPath}`;
  return (
    <>
      {isLeaf ? (
        <div className="dnd-image-file-view-main">
          {folders.map((foldername, idx) => (
            <div key={idx} className="dnd-image-file-item">
              <FileThumbnail
                imagePath={`${baseOriginalImageFolderPath}/${foldername}`}
                width={80}
                height={80}
                padding={1}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="list-view-main">
          {folders.map((foldername, idx) => (
            <div
              key={idx}
              className={`list-view-item ${
                idx % 2 === 0 ? "list-view-item-even" : "list-view-item-odd"
              }`}
              onClick={isLeaf ? () => {} : () => setSelectedFolder(foldername)}
            >
              <span className="arrow">{"＞"}</span>
              <img
                className="img-icon"
                src={"/assets/folder-icon.svg"}
                alt=""
              />
              <span className="folder-name-span">{foldername}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default DndListView;
