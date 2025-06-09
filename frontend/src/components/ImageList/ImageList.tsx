import React, { useState, useEffect } from "react";
import config from "@/config/config.json";
import "@/styles/AllComponentsStyle.css";
import Image from "../Image/Image";
import { imageInfo } from "@/app/projects/[projectId]/page";
import { fullImageInfo } from "../Image/Image";
import "./styles.modules.css";

type imagesListProps = {
  fullImageInfolist: imageInfo[];
  originalImageFolderPath: string;
};

const ImageList: React.FC<imagesListProps> = ({
  fullImageInfolist,
  originalImageFolderPath,
}: imagesListProps) => {
  const sortedImagesByDate: imageInfo[] = [...fullImageInfolist].sort(
    (a, b) => a.created_at.getTime() - b.created_at.getTime()
  );
  return (
    <>
      <div className="image-thumb-list">
        {sortedImagesByDate.map((image: imageInfo) => {
          return (
            <div key={image.id} className="image-thumb-div">
              <Image
                id={image.id}
                name={image.name}
                is_created_caption={image.is_created_caption}
                caption={image.caption}
                original_images_folder_path={originalImageFolderPath}
              />
            </div>
          );
        })}
      </div>
    </>
  );
};
export default ImageList;
