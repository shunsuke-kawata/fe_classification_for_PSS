import { useEffect, useRef, useState } from "react";
import { newImageType, postImage } from "@/api/api";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, selectUser } from "@/lib/store";

type uploadImageModalProps = {
  projectId: number;
  setIsUploadImageModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
};
type uploadingFile = {
  file: File;
  uploadStatus: "waiting" | "success" | "failed";
};
const UploadImageModal: React.FC<uploadImageModalProps> = ({
  projectId,
  setIsUploadImageModalOpen,
}) => {
  const [inputImages, setInputImages] = useState<FileList | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadModalStatus, setUploadModalStatus] = useState<
    "select" | "uploading" | "finish"
  >("select");
  const [uploadingImages, setUploadingImages] = useState<
    uploadingFile[] | null
  >(null);
  const loginedUser = useSelector(selectUser);
  const uploadingImageNow = useRef<File | null>(null);

  useEffect(() => {
    if (uploadModalStatus === "uploading") {
      uploadImages();
    }
  }, [uploadingImages]);

  const handleChangeUploadImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    let tmpInputImages = e.target.files;
    setInputImages(tmpInputImages);
    console.log(Array.from(tmpInputImages));
  };

  const handleCancel = () => {
    setIsUploadImageModalOpen(false);
  };

  const handleUploadImages = () => {
    if (inputImages === null) return;
    const tmpUploadingImages: uploadingFile[] = Array.from(inputImages).map(
      (inputImage) => {
        return {
          file: inputImage,
          uploadStatus: "waiting",
        };
      }
    );
    setUploadingImages(tmpUploadingImages);
    setUploadModalStatus("uploading");
  };

  const uploadImages = async () => {
    if (uploadingImages === null) return;

    for (let i = 0; i < uploadingImages.length; i++) {
      uploadingImageNow.current = uploadingImages[i].file;
      if (loginedUser.id === null) {
        // Handle the error as appropriate for your app
        alert("ユーザー情報が取得できません。再度ログインしてください。");
        setIsUploadImageModalOpen(false);
        return;
      }
      const tmpNewImage: newImageType = {
        name: uploadingImageNow.current.name,
        project_id: projectId,
        image_file: uploadingImageNow.current,
        uploaded_user_id: loginedUser.id,
      };
      const res = await postImage(tmpNewImage);
      console.log(res);
    }
    setIsUploadImageModalOpen(false);
  };

  return (
    <>
      <div className="upload-image-modal-main">
        <label className="form-title">画像アップロード</label>

        {uploadModalStatus === "select" ? (
          <div className="modal-contents">
            <div>
              <input
                type="file"
                multiple
                accept="image/jpeg, image/png, image/webp, image/bmp, image/tiff, image/svg+xml"
                className="select-image-input"
                onChange={handleChangeUploadImages}
              />
            </div>
            <div className="file-preview">
              <div className="inner-file-preview">
                {inputImages ? (
                  Array.from(inputImages).map((inputImage, index) => (
                    <div key={index} className="file-name-row">
                      <label>
                        <span className="file-index">{index + 1}</span>.
                        {inputImage.name}
                      </label>
                    </div>
                  ))
                ) : (
                  <></>
                )}
              </div>
            </div>
          </div>
        ) : uploadModalStatus === "uploading" ? (
          <div className="modal-contents"></div>
        ) : (
          <></>
        )}
        <div className="upload-image-buttons">
          <input
            type="button"
            className="common-buttons user-form-button"
            value="キャンセル"
            onClick={handleCancel}
          />
          <input
            type="button"
            className="common-buttons user-form-button right-button"
            value="アップロード"
            disabled={uploadModalStatus !== "select"}
            onClick={handleUploadImages}
          />
        </div>
      </div>
      <div className="overlay"></div>
    </>
  );
};
export default UploadImageModal;
