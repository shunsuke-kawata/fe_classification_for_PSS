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
  uploadStatus: "waiting" | "uploading" | "success" | "failed";
  retryCount: number;
};
const UploadImageModal: React.FC<uploadImageModalProps> = ({
  projectId,
  setIsUploadImageModalOpen,
}) => {
  const [inputImages, setInputImages] = useState<FileList | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [uploadModalStatus, setUploadModalStatus] = useState<
    "select" | "uploading" | "finish"
  >("select");
  const [uploadingImages, setUploadingImages] = useState<
    uploadingFile[] | null
  >(null);
  const loginedUser = useSelector(selectUser);
  const uploadingImageNow = useRef<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (uploadModalStatus === "uploading" && uploadingImages && !isUploading) {
      setIsUploading(true);
      uploadImages();
    }
  }, [uploadModalStatus, uploadingImages]);

  const handleChangeUploadImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    let tmpInputImages = e.target.files;
    setInputImages(tmpInputImages);
    // ファイル選択時はフォルダ選択をクリア
    if (folderInputRef.current) folderInputRef.current.value = "";
  };

  const handleChangeUploadFolder = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    // フォルダから画像ファイルのみをフィルタリング
    const imageFiles: File[] = [];
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];

    Array.from(e.target.files).forEach((file) => {
      if (
        allowedTypes.includes(file.type.toLowerCase()) ||
        /\.(jpg|jpeg|png)$/i.test(file.name)
      ) {
        // ファイル名からパス部分を除去（最後の / または \ 以降のファイル名のみを取得）
        const fileName = file.webkitRelativePath
          ? file.webkitRelativePath.split("/").pop() || file.name
          : file.name;

        // 新しいFileオブジェクトを作成（ファイル名のみに変更）
        const renamedFile = new File([file], fileName, {
          type: file.type,
          lastModified: file.lastModified,
        });

        imageFiles.push(renamedFile);
      }
    });

    if (imageFiles.length > 0) {
      // FileListのような構造を作成
      const dt = new DataTransfer();
      imageFiles.forEach((file) => dt.items.add(file));
      setInputImages(dt.files);
      // フォルダ選択時はファイル選択をクリア
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleCancel = () => {
    setIsUploadImageModalOpen(false);
  };

  const handleClose = () => {
    setIsUploadImageModalOpen(false);
    window.location.reload();
  };

  const handleUploadImages = () => {
    if (inputImages === null) return;
    const tmpUploadingImages: uploadingFile[] = Array.from(inputImages).map(
      (inputImage) => {
        return {
          file: inputImage,
          uploadStatus: "waiting",
          retryCount: 0,
        };
      }
    );
    setUploadingImages(tmpUploadingImages);
    setUploadModalStatus("uploading");
  };

  const uploadSingleImage = async (
    imageData: uploadingFile,
    index: number
  ): Promise<boolean> => {
    const maxRetries = 3;
    let currentRetry = imageData.retryCount;

    while (currentRetry < maxRetries) {
      try {
        if (loginedUser.id === null) {
          throw new Error("ログインユーザーが見つかりません");
        }

        // アップロード開始状態に更新
        setUploadingImages((prev) => {
          if (!prev) return prev;
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            uploadStatus: "uploading",
            retryCount: currentRetry,
          };
          return updated;
        });

        const tmpNewImage: newImageType = {
          project_id: projectId,
          image_file: imageData.file,
          uploaded_user_id: loginedUser.id,
        };

        const res = await postImage(tmpNewImage);

        // 成功時の状態更新
        setUploadingImages((prev) => {
          if (!prev) return prev;
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            uploadStatus: "success",
            retryCount: currentRetry,
          };
          return updated;
        });

        return true;
      } catch (error) {
        currentRetry++;
        console.warn(
          `画像 ${imageData.file.name} のアップロードに失敗 (${currentRetry}/${maxRetries}回目):`,
          error
        );

        // 最大リトライ回数に達した場合
        if (currentRetry >= maxRetries) {
          setUploadingImages((prev) => {
            if (!prev) return prev;
            const updated = [...prev];
            updated[index] = {
              ...updated[index],
              uploadStatus: "failed",
              retryCount: currentRetry,
            };
            return updated;
          });
          return false;
        }

        // リトライ前に少し待機
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return false;
  };

  const uploadImages = async () => {
    if (!uploadingImages) return;

    // 逐次実行で0.5秒間隔を設ける
    for (let i = 0; i < uploadingImages.length; i++) {
      const imageData = uploadingImages[i];

      const _ = await uploadSingleImage(imageData, i);

      // 次のリクエストまで0.01秒待機（最後のファイル以外）
      if (i < uploadingImages.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    console.log(`🎉 全てのアップロード処理完了`);

    setIsUploading(false);
    setUploadModalStatus("finish");

    // アップロード完了後、2秒待ってから自動で閉じる
    setTimeout(() => {
      setIsUploadImageModalOpen(false);
      window.location.reload();
    }, 2000);
  };

  return (
    <>
      <div className="upload-image-modal-main">
        <label className="form-title">画像アップロード</label>

        {uploadModalStatus === "select" ? (
          <div className="modal-contents">
            <div className="input-container">
              <div className="input-buttons-row">
                <div className="file-input-wrapper">
                  <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept="image/jpeg, image/png, image/webp, image/bmp, image/tiff, image/svg+xml"
                    className="select-image-input-hidden"
                    onChange={handleChangeUploadImages}
                    id="file-input"
                  />
                  <label htmlFor="file-input" className="select-file-button">
                    ファイル選択
                  </label>
                </div>
                <div className="folder-input-wrapper">
                  <input
                    ref={folderInputRef}
                    type="file"
                    {...({ webkitdirectory: "" } as any)}
                    className="select-image-input-hidden"
                    onChange={handleChangeUploadFolder}
                    id="folder-input"
                  />
                  <label htmlFor="folder-input" className="select-file-button">
                    フォルダ選択
                  </label>
                </div>
              </div>
              <div className="input-description">
                JPG・JPEG・PNG画像をアップロードできます
              </div>
            </div>

            {inputImages && (
              <div className="file-list-header">
                <span className="selected-files-count">
                  選択された画像: {inputImages.length}枚
                </span>
              </div>
            )}
            <div className="file-preview">
              <div className="inner-file-preview">
                {inputImages ? (
                  <>
                    {Array.from(inputImages).map((inputImage, index) => (
                      <div key={index} className="file-item-card">
                        <div className="file-item-content">
                          <div className="file-details">
                            <div className="file-name">{inputImage.name}</div>
                            <div className="file-info">
                              <span className="file-size">
                                {(inputImage.size / 1024 / 1024).toFixed(2)} MB
                              </span>
                              <span className="file-type">
                                {inputImage.type.split("/")[1]?.toUpperCase() ||
                                  "IMAGE"}
                              </span>
                            </div>
                          </div>
                          <div className="file-number">{index + 1}</div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : null}
              </div>
            </div>
          </div>
        ) : uploadModalStatus === "uploading" ||
          uploadModalStatus === "finish" ? (
          <div className="modal-contents">
            {uploadingImages && (
              <>
                <div className="upload-progress-section">
                  <div className="progress-stats">
                    <span className="total-files">
                      総数: {uploadingImages.length}枚
                    </span>
                    <span className="success-files">
                      成功:{" "}
                      {
                        uploadingImages.filter(
                          (img) => img.uploadStatus === "success"
                        ).length
                      }
                      枚
                    </span>
                    <span className="failed-files">
                      失敗:{" "}
                      {
                        uploadingImages.filter(
                          (img) => img.uploadStatus === "failed"
                        ).length
                      }
                      枚
                    </span>
                  </div>
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar"
                      style={{
                        width: `${
                          (uploadingImages.filter(
                            (img) =>
                              img.uploadStatus === "success" ||
                              img.uploadStatus === "failed"
                          ).length /
                            uploadingImages.length) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <div className="progress-percentage">
                    {Math.round(
                      (uploadingImages.filter(
                        (img) =>
                          img.uploadStatus === "success" ||
                          img.uploadStatus === "failed"
                      ).length /
                        uploadingImages.length) *
                        100
                    )}
                    %
                  </div>
                </div>
                <div className="file-preview">
                  <div className="inner-file-preview">
                    {uploadingImages.map((uploadingImage, index) => (
                      <div key={index} className="file-upload-card">
                        <div className="file-upload-content">
                          <div className="file-details">
                            <div className="file-name">
                              {uploadingImage.file.name}
                            </div>
                            <div className="file-info">
                              <span className="file-size">
                                {(
                                  uploadingImage.file.size /
                                  1024 /
                                  1024
                                ).toFixed(2)}{" "}
                                MB
                              </span>
                              {uploadingImage.retryCount > 0 &&
                                uploadingImage.uploadStatus === "uploading" && (
                                  <span className="retry-info">
                                    試行中: {uploadingImage.retryCount + 1}/3
                                  </span>
                                )}
                              {uploadingImage.retryCount > 0 &&
                                uploadingImage.uploadStatus === "failed" && (
                                  <span className="retry-info">
                                    {uploadingImage.retryCount}回試行済み
                                  </span>
                                )}
                            </div>
                          </div>
                          <div className="file-status">
                            <div className="file-number">{index + 1}</div>
                            <div
                              className={`upload-status upload-status-${uploadingImage.uploadStatus}`}
                            >
                              {uploadingImage.uploadStatus === "waiting" &&
                                "⏳"}
                              {uploadingImage.uploadStatus === "uploading" &&
                                "🔄"}
                              {uploadingImage.uploadStatus === "success" &&
                                "✅"}
                              {uploadingImage.uploadStatus === "failed" && "❌"}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <></>
        )}
        <div className="upload-image-buttons">
          <div className="button-container">
            {uploadModalStatus === "finish" ? (
              <input
                type="button"
                className="common-buttons user-form-button center-button"
                value="閉じる"
                onClick={handleClose}
              />
            ) : (
              <>
                <input
                  type="button"
                  className="common-buttons user-form-button"
                  value="キャンセル"
                  onClick={handleCancel}
                  disabled={uploadModalStatus === "uploading"}
                />
                <input
                  type="button"
                  className="common-buttons user-form-button right-button"
                  value="アップロード"
                  disabled={uploadModalStatus !== "select"}
                  onClick={handleUploadImages}
                />
              </>
            )}
          </div>
        </div>
      </div>
      <div className="overlay"></div>
    </>
  );
};
export default UploadImageModal;
