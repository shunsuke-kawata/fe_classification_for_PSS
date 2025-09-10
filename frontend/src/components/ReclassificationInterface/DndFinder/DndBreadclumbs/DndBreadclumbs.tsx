import "./styles.modules.css";

interface dndBreadcrumbsProps {
  parentFolders: string[];
  setSelectedFolder: React.Dispatch<React.SetStateAction<string>>;
}

const DndBreadcrumbs: React.FC<dndBreadcrumbsProps> = ({
  parentFolders,
  setSelectedFolder,
}) => {
  console.log(parentFolders);
  const items = parentFolders;

  const truncateFolderName = (name: string) => {
    if (name.length <= 6) return name;
    return name.slice(0, 3) + "•••" + name.slice(-3);
  };

  const toParentFolder = () => {
    if (items.length === 0) {
      return;
    } else if (items.length === 1) {
      setSelectedFolder("top");
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
        {items.length === 0 ? "top" : items[items.length - 1]}
      </span>
    </div>
  );
};

export default DndBreadcrumbs;
