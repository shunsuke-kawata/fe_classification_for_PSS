import "./styles.modules.css";

interface listViewProps {
  folders: string[];
}
const ListView: React.FC<listViewProps> = ({ folders }: listViewProps) => {
  console.log(folders);
  return (
    <>
      <div className="list-view-main">listview</div>
    </>
  );
};

export default ListView;
