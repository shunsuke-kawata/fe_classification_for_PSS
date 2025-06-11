import "./styles.modules.css";

interface listViewProps {
  isLeaf: boolean;
  folders: string[];
  setSelectedFolder: React.Dispatch<React.SetStateAction<string>>;
}
const ListView: React.FC<listViewProps> = ({
  isLeaf,
  folders,
  setSelectedFolder,
}: listViewProps) => {
  return (
    <div className="list-view-main">
      {folders.map((foldername, idx) => (
        <div
          key={idx}
          className={`list-view-item ${
            idx % 2 === 0 ? "list-view-item-even" : "list-view-item-odd"
          }`}
          onClick={isLeaf ? () => {} : () => setSelectedFolder(foldername)}
        >
          {isLeaf ? <></> : <span className="arrow">{"＞"}</span>}
          <img
            className="img-icon"
            src={
              isLeaf ? "/assets/image-file-icon.svg" : "/assets/folder-icon.svg"
            }
            alt=""
          />
          <span className="folder-name-span">{foldername}</span>
        </div>
      ))}
    </div>
  );
};

export default ListView;
