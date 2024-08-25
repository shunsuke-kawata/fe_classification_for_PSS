import React, { useState, useEffect } from "react";
import config from "@/config/config.json";
import "@/styles/AllComponentsStyle.css";

type imagesListProps = {
  imagesPath: string[];
};

const ImageList: React.FC<imagesListProps> = ({ imagesPath }) => {
  const [displayImagesPath, setDisplayImagesPath] = useState<string[]>([]);
  useEffect(() => {}, [displayImagesPath, imagesPath]);
  return (
    <>
      {imagesPath.map((imagePath, index) => (
        <div key={index} className="display-image-div">
          <img className="display-img" src={imagePath} alt={imagePath} />
        </div>
      ))}
    </>
  );
};
export default ImageList;
