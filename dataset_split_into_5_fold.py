import os
import shutil
from pathlib import Path
from sklearn.model_selection import KFold

# =====================================================
# PATHS
# =====================================================

dataset_root = Path(
    "/home/zaman/Code/Breast_Cancer_Detection_and_Monitoring/Cancer.v1i.yolov8/train"
)

images_dir = dataset_root / "images"
labels_dir = dataset_root / "labels"

output_root = Path(
    "/home/zaman/Code/Breast_Cancer_Detection_and_Monitoring/Cancer.v1i.yolov8/5-fold"
)

# =====================================================
# GET ALL IMAGES
# =====================================================

image_files = sorted(
    list(images_dir.glob("*.jpg")) +
    list(images_dir.glob("*.jpeg")) +
    list(images_dir.glob("*.png"))
)

print(f"Total images found: {len(image_files)}")

# =====================================================
# CREATE 5-FOLDS
# =====================================================

kf = KFold(
    n_splits=5,
    shuffle=True,
    random_state=42
)

for fold_idx, (train_idx, val_idx) in enumerate(
        kf.split(image_files),
        start=1):

    print(f"Creating Fold {fold_idx}")

    fold_dir = output_root / f"fold{fold_idx}"

    train_images = fold_dir / "train" / "images"
    train_labels = fold_dir / "train" / "labels"

    val_images = fold_dir / "val" / "images"
    val_labels = fold_dir / "val" / "labels"

    train_images.mkdir(parents=True, exist_ok=True)
    train_labels.mkdir(parents=True, exist_ok=True)

    val_images.mkdir(parents=True, exist_ok=True)
    val_labels.mkdir(parents=True, exist_ok=True)

    # =====================================
    # TRAIN FILES
    # =====================================

    for idx in train_idx:

        img_path = image_files[idx]

        label_path = (
            labels_dir /
            f"{img_path.stem}.txt"
        )

        shutil.copy2(
            img_path,
            train_images / img_path.name
        )

        if label_path.exists():
            shutil.copy2(
                label_path,
                train_labels / label_path.name
            )

    # =====================================
    # VALIDATION FILES
    # =====================================

    for idx in val_idx:

        img_path = image_files[idx]

        label_path = (
            labels_dir /
            f"{img_path.stem}.txt"
        )

        shutil.copy2(
            img_path,
            val_images / img_path.name
        )

        if label_path.exists():
            shutil.copy2(
                label_path,
                val_labels / label_path.name
            )

print("\nAll 5 folds created successfully.")