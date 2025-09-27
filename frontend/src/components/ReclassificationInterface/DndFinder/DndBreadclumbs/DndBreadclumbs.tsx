import "./styles.modules.css";

interface dndBreadcrumbsProps {
  parentFolders: string[];
  setSelectedFolder: React.Dispatch<React.SetStateAction<string>>;
  topLevelId?: string;
}

const DndBreadcrumbs: React.FC<dndBreadcrumbsProps> = ({
  parentFolders,
  setSelectedFolder,
  topLevelId,
}) => {
  console.log(parentFolders);
  const items = parentFolders;

  const toParentFolder = () => {
    if (items.length === 0) {
      return;
    } else if (items.length === 1) {
      if (topLevelId) {
        setSelectedFolder(topLevelId);
      }
    } else {
      setSelectedFolder(items[items.length - 2]);
    }
  };

  return (
    <div className="breadcrumbs">
      <div className="parent-folder-button" onClick={() => toParentFolder()}>
        <span
          className={
            items.length === 0 ? "parent-folder-button-span-disabled" : ""
          }
        >
          ..
        </span>
      </div>
      <span className="breadcrumb-item">
        {items.length === 0 ? topLevelId || "Root" : items[items.length - 1]}
      </span>
    </div>
  );
};

export default DndBreadcrumbs;
