"use client";
import React, { useState, useEffect } from "react";

type imagesListProps = {
  displayStatus: string;
};
const ImageList: React.FC<imagesListProps> = ({ displayStatus }) => {
  const [displayImagesPath, setDisplayImagesPath] = useState<string[]>([]);
  useEffect(() => {
    console.log(displayStatus);
  }, [displayImagesPath]);
  return <></>;
};
export default ImageList;
