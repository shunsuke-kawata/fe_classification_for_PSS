import config from "@/config/config.json";
import "./styles.modules.css";
export type fullImageInfo = {
  id: string;
  name: string;
  is_created_caption: boolean;
  caption: string;
  original_images_folder_path: string;
};

const Image: React.FC<fullImageInfo> = (props) => {
  const { id, name, is_created_caption, caption, original_images_folder_path } =
    props;

  const originalImagePath = `${config.backend_base_url}/images/${original_images_folder_path}/${name}`; // 画像のパスを生成
  return (
    <>
      <div className="image-thumb-div">
        <img className="image-thumb" src={originalImagePath} alt={caption} />
      </div>
    </>
  );
};

export default Image;
