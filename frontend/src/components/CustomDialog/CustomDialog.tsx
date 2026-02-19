import React from "react";
import styles from "./CustomDialog.module.css";

type CustomDialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  imageUrl?: string;
  folderImages?: string[];
  imageFolderPath?: string;
  onYes: () => void;
  onNo: () => void;
};

const CustomDialog: React.FC<CustomDialogProps> = ({
  isOpen,
  title,
  message,
  imageUrl,
  folderImages = [],
  imageFolderPath = "",
  onYes,
  onNo,
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
        </div>
        <div className={styles.content}>
          <div className={styles.mainContent}>
            <div className={styles.questionSection}>
              <p className={styles.mainQuestion}>
                この物体がある場所は設定された分類基準に合っていますか？
              </p>
              <p className={styles.subQuestion}>
                （階層の修正は必要ないですか？）
              </p>
              {imageUrl && (
                <div className={styles.imageContainer}>
                  <img
                    src={imageUrl}
                    alt="選択された画像"
                    className={styles.thumbnail}
                  />
                </div>
              )}
            </div>
            <div className={styles.optionsSection}>
              <div className={styles.option}>
                <span className={styles.optionIcon}>✅</span>
                <div className={styles.optionText}>
                  <strong>「はい」を選択</strong>
                  <br />
                  直感に合っていて階層構造の修正が必要ない場合
                </div>
              </div>
              <div className={styles.option}>
                <span className={styles.optionIcon}>❌</span>
                <div className={styles.optionText}>
                  <strong>「いいえ」を選択</strong>
                  <br />
                  直感に合っておらず階層構造の修正が必要な場合
                </div>
              </div>
            </div>
          </div>
          {folderImages && folderImages.length > 0 && (
            <div className={styles.imageListSection}>
              <h4 className={styles.imageListTitle}>フォルダ内の画像一覧</h4>
              <div className={styles.imageListScroll}>
                {folderImages.map((imageName, index) => (
                  <div key={index} className={styles.imageListItem}>
                    <img
                      src={`${imageFolderPath}/${imageName}`}
                      alt={imageName}
                      className={styles.imageListThumbnail}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className={styles.buttonGroup}>
          <button className={styles.noButton} onClick={onNo}>
            いいえ
          </button>
          <button className={styles.yesButton} onClick={onYes}>
            はい
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomDialog;
