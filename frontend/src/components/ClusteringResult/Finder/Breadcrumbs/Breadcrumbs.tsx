import "./styles.modules.css";
interface breadcrumbsProps {
  parentFolders: string[];
  setSelectedFolder: React.Dispatch<React.SetStateAction<string>>;
}

const Breadcrumbs: React.FC<breadcrumbsProps> = ({
  parentFolders,
  setSelectedFolder,
}: breadcrumbsProps) => {
  console.log(parentFolders);
  // parentFoldersまたはdummyを使用してパンクズリストを生成
  const items = parentFolders;

  return (
    <div className="breadcrumbs">
      <span
        className="breadcrumb-item"
        onClick={() => setSelectedFolder("top")}
      >
        {"top"}
      </span>
      <span className="separator">{"＞"}</span>
      {items.map((item, index) => (
        <span key={index}>
          <span
            className="breadcrumb-item"
            onClick={() => setSelectedFolder(item)}
          >
            {item}
          </span>
          {index < items.length - 1 && (
            <span className="separator">{"＞"}</span>
          )}
        </span>
      ))}
    </div>
  );
};

export default Breadcrumbs;
