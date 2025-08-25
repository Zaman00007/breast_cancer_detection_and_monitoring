from fastapi import FastAPI, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.staticfiles import StaticFiles
import os
import shutil
import csv
from ultralytics import YOLO
import cv2
import numpy as np
from typing import List
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
CSV_FILE = "patients.csv"

BIOPSY_WEIGHTS = "/home/zaman/Code/Breast_Cancer_Detection_and_Monitoring/runs/detect/train/weights/best.pt"
MAMMO_WEIGHTS = "/home/zaman/Code/Breast_Cancer_Detection_and_Monitoring/runs/detect/mammo_yolo_detector/weights/best.pt"

os.makedirs(UPLOAD_DIR, exist_ok=True)
if not os.path.exists(CSV_FILE):
    with open(CSV_FILE, mode="w", newline="") as f:
        csv.writer(f).writerow(["patient_id", "name", "age", "weight", "height", "biopsy_file", "is_cancerous"])

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

try:
    biopsy_model = YOLO(BIOPSY_WEIGHTS)
except Exception as e:
    raise RuntimeError(f"Failed to load biopsy model: {e}")

try:
    mammo_model = YOLO(MAMMO_WEIGHTS)
except Exception as e:
    raise RuntimeError(f"Failed to load mammography model: {e}")

CANCER_CLASSES = [0, 1, 2]

def save_upload_to(path: str, file: UploadFile) -> None:
    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

def to_numpy_boxes(result) -> np.ndarray:
    if result.boxes is None or result.boxes.data is None:
        return np.zeros((0, 6), dtype=float)
    data = result.boxes.data
    try:
        arr = data.cpu().numpy()
    except Exception:
        arr = np.array(data)
    if arr.shape[1] < 6:
        pad_cols = 6 - arr.shape[1]
        arr = np.pad(arr, ((0, 0), (0, pad_cols)), mode="constant")
    return arr[:, :6]

def total_area_xyxy(boxes: np.ndarray) -> float:
    if boxes.size == 0:
        return 0.0
    x1, y1, x2, y2 = boxes[:, 0], boxes[:, 1], boxes[:, 2], boxes[:, 3]
    w = np.maximum(0, x2 - x1)
    h = np.maximum(0, y2 - y1)
    return float(np.sum(w * h))

def iou_first_box(a: np.ndarray, b: np.ndarray) -> float:
    if a.size == 0 or b.size == 0:
        return None
    ax1, ay1, ax2, ay2 = a[0, 0], a[0, 1], a[0, 2], a[0, 3]
    bx1, by1, bx2, by2 = b[0, 0], b[0, 1], b[0, 2], b[0, 3]
    xA = max(ax1, bx1)
    yA = max(ay1, by1)
    xB = min(ax2, bx2)
    yB = min(ay2, by2)
    inter = max(0, xB - xA) * max(0, yB - yA)
    areaA = max(0, ax2 - ax1) * max(0, ay2 - ay1)
    areaB = max(0, bx2 - bx1) * max(0, by2 - by1)
    denom = areaA + areaB - inter
    if denom <= 0:
        return None
    return float(inter / denom)

def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)

def list_sorted_by_mtime(dir_path: str, prefix: str = "") -> List[str]:
    if not os.path.isdir(dir_path):
        return []
    files = [f for f in os.listdir(dir_path) if os.path.isfile(os.path.join(dir_path, f))]
    if prefix:
        files = [f for f in files if f.startswith(prefix)]
    files.sort(key=lambda x: os.path.getmtime(os.path.join(dir_path, x)))
    return files

# 🔹 helper: save mammography boxes to CSV
def save_mammo_boxes_to_csv(patientId: str, boxes: np.ndarray):
    patient_dir = os.path.join(UPLOAD_DIR, patientId, "mammography")
    ensure_dir(patient_dir)
    csv_path = os.path.join(patient_dir, f"{patientId}_mammography.csv")

    file_exists = os.path.exists(csv_path)
    with open(csv_path, mode="a", newline="") as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(["timestamp", "x1", "y1", "x2", "y2"])
        timestamp = datetime.now().isoformat()
        for box in boxes:
            x1, y1, x2, y2 = box[:4]
            writer.writerow([timestamp, float(x1), float(y1), float(x2), float(y2)])


@app.post("/predict")
async def predict(
    file: UploadFile,
    patientId: str = Form(...),
    name: str = Form(...),
    age: str = Form(...),
    weight: str = Form(...),
    height: str = Form(...),
):
    try:
        patient_dir = os.path.join(UPLOAD_DIR, patientId, "biopsy")
        ensure_dir(patient_dir)
        original_path = os.path.join(patient_dir, file.filename)
        save_upload_to(original_path, file)

        results_list = biopsy_model.predict(original_path, imgsz=640)
        result = results_list[0]
        boxes = to_numpy_boxes(result)
        is_cancerous = any(int(cls) in CANCER_CLASSES for cls in boxes[:, 5].tolist()) if boxes.size else False

        annotated_img = result.plot()
        annotated_file_name = "annotated_" + os.path.basename(file.filename)
        annotated_file_path = os.path.join(patient_dir, annotated_file_name)
        cv2.imwrite(annotated_file_path, annotated_img)

        with open(CSV_FILE, mode="a", newline="") as f:
            csv.writer(f).writerow([
                patientId, name, age, weight, height, file.filename, "Yes" if is_cancerous else "No"
            ])

        annotated_url = f"/uploads/{patientId}/biopsy/{annotated_file_name}"
        original_url = f"/uploads/{patientId}/biopsy/{os.path.basename(file.filename)}"

        return {
            "patient_id": patientId,
            "is_cancerous": is_cancerous,
            "original_file": original_url,
            "annotated_file": annotated_url
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict-mammography")
async def predict_mammography(
    file: UploadFile,
    patientId: str = Form(...)
):
    try:
        patient_dir = os.path.join(UPLOAD_DIR, patientId, "mammography")
        ensure_dir(patient_dir)
        original_path = os.path.join(patient_dir, file.filename)
        save_upload_to(original_path, file)

        results_list = mammo_model.predict(original_path, imgsz=640)
        result = results_list[0]
        boxes = to_numpy_boxes(result)
        is_cancerous = any(int(cls) in CANCER_CLASSES for cls in boxes[:, 5].tolist()) if boxes.size else False

        # 🔹 save detections into patient-specific CSV
        save_mammo_boxes_to_csv(patientId, boxes)

        annotated_img = result.plot()
        annotated_file_name = "annotated_" + os.path.basename(file.filename)
        annotated_file_path = os.path.join(patient_dir, annotated_file_name)
        cv2.imwrite(annotated_file_path, annotated_img)

        prev_annotated = list_sorted_by_mtime(patient_dir, prefix="annotated_")
        change_in_area = None
        iou_score = None
        if len(prev_annotated) >= 2:
            prev_path = os.path.join(patient_dir, prev_annotated[-2])
            prev_results = mammo_model.predict(prev_path, imgsz=640)[0]
            prev_boxes = to_numpy_boxes(prev_results)

            prev_area = total_area_xyxy(prev_boxes)
            curr_area = total_area_xyxy(boxes)
            if prev_area > 0:
                change_in_area = float(((curr_area - prev_area) / prev_area) * 100.0)

            iou_score = iou_first_box(prev_boxes, boxes)

        annotated_url = f"/uploads/{patientId}/mammography/{annotated_file_name}"
        original_url = f"/uploads/{patientId}/mammography/{os.path.basename(file.filename)}"

        return {
            "patient_id": patientId,
            "is_cancerous": is_cancerous,
            "original_file": original_url,
            "annotated_file": annotated_url,
            "change_in_area": change_in_area,
            "iou": iou_score
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/latest-image/{patientId}")
async def latest_image(patientId: str):
    try:
        mammo_dir = os.path.join(UPLOAD_DIR, patientId, "mammography")
        files = list_sorted_by_mtime(mammo_dir)
        if not files:
            return JSONResponse({"imageUrl": None})
        latest = files[-1]
        return JSONResponse({"imageUrl": f"/uploads/{patientId}/mammography/{latest}"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/latest-biopsy-image/{patientId}")
async def latest_biopsy_image(patientId: str):
    try:
        biopsy_dir = os.path.join(UPLOAD_DIR, patientId, "biopsy")
        files = list_sorted_by_mtime(biopsy_dir)
        if not files:
            return JSONResponse({"imageUrl": None})
        latest = files[-1]
        return JSONResponse({"imageUrl": f"/uploads/{patientId}/biopsy/{latest}"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
