import { useEffect } from "react";

type groupListProps = {
  objectGroups: {
    [key: string]: string[];
  };
};
const GroupList: React.FC<groupListProps> = ({ objectGroups }) => {
  useEffect(() => {
    console.log(objectGroups);
  }, []);
  return (
    <>
      {Object.entries(objectGroups).map((objectGroup, index) => (
        <div key={index} className="object-group-thumb-div">
          <p className="group-title">{objectGroup[0]}</p>
          <img
            className="object-group-thumb-img"
            src={objectGroup[1][0]}
            alt={objectGroup[0]}
          />
        </div>
      ))}
    </>
  );
};

export default GroupList;
