import "./styles.modules.css";

interface BreadcrumbsProps {
  parentFolders: string[];
  setSelectedFolder: React.Dispatch<React.SetStateAction<string>>;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  parentFolders,
  setSelectedFolder,
}) => {
  const items = parentFolders;

  const truncateFolderName = (name: string) => {
    if (name.length <= 6) return name;
    return name.slice(0, 3) + "•••" + name.slice(-3);
  };

  return (
    <div className="breadcrumbs">
      <span
        className="breadcrumb-item"
        onClick={() => setSelectedFolder("top")}
      >
        top
      </span>
      <span className="separator">＞</span>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const shouldTruncate = items.length >= 3 && !isLast;
        const displayName = shouldTruncate ? truncateFolderName(item) : item;

        return (
          <span key={index}>
            <span
              className="breadcrumb-item"
              onClick={() => setSelectedFolder(item)}
            >
              {displayName}
            </span>
            {!isLast && <span className="separator">＞</span>}
          </span>
        );
      })}
    </div>
  );
};

export default Breadcrumbs;
