import "./styles.modules.css";
interface breadcrumbsProps {
  parentFolders: string[];
}

const Breadcrumbs: React.FC<breadcrumbsProps> = ({
  parentFolders,
}: breadcrumbsProps) => {
  console.log(parentFolders);

  const dummy: string[] = ["1", "2", "3"];

  // parentFoldersまたはdummyを使用してパンクズリストを生成
  const items = parentFolders.length > 0 ? parentFolders : dummy;

  return (
    <div className="breadcrumbs">
      <span className="separator">{">"}</span>
      {items.map((item, index) => (
        <span key={index}>
          <span
            className="breadcrumb-item"
            onClick={() => {
              // TODO: ここに各itemに対応した関数を実装
              console.log(`Clicked on: ${item} at index: ${index}`);
            }}
          >
            {item}
          </span>
          {index < items.length - 1 && <span className="separator">{">"}</span>}
        </span>
      ))}
    </div>
  );
};

export default Breadcrumbs;
