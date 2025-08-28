import os
import csv
import io
from datetime import datetime
from typing import List
from fastapi import FastAPI, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import cv2
import numpy as np
import boto3
import pandas as pd
from dotenv import load_dotenv
from fastapi.responses import JSONResponse


load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "uploads")
SUPABASE_ACCESS_KEY = os.getenv("SUPABASE_ACCESS_KEY")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")

CSV_FILE = os.getenv("CSV_FILE", "patients.csv")
BIOPSY_WEIGHTS = os.getenv("BIOPSY_WEIGHTS")
MAMMO_WEIGHTS = os.getenv("MAMMO_WEIGHTS")
CANCER_CLASSES = [0, 1, 2]

# Initialize FastAPI
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Initialize S3 client for Supabase
s3_client = boto3.client(
    "s3",
    endpoint_url=SUPABASE_URL,
    aws_access_key_id=SUPABASE_ACCESS_KEY,
    aws_secret_access_key=SUPABASE_SECRET_KEY
)

# Load YOLO models
try:
    biopsy_model = YOLO(BIOPSY_WEIGHTS)
except Exception as e:
    raise RuntimeError(f"Failed to load biopsy model: {e}")

try:
    mammo_model = YOLO(MAMMO_WEIGHTS)
except Exception as e:
    raise RuntimeError(f"Failed to load mammography model: {e}")

# Ensure CSV exists
if not os.path.exists(CSV_FILE):
    with open(CSV_FILE, "w", newline="") as f:
        csv.writer(f).writerow(["patient_id", "name", "age", "weight", "height", "biopsy_file", "is_cancerous"])

# ---------- Helper functions ----------

# ---------- S3 helpers ----------

def obj_last_modified(key: str):
    meta = s3_client.head_object(Bucket=SUPABASE_BUCKET, Key=key)
    return meta['LastModified']

def list_s3_objects(prefix: str) -> List[str]:
    try:
        response = s3_client.list_objects_v2(Bucket=SUPABASE_BUCKET, Prefix=prefix)
        if 'Contents' not in response:
            return []
        files = [obj['Key'] for obj in response['Contents']]
        files.sort(key=lambda k: obj_last_modified(k))
        return files
    except ClientError:
        return []

def get_latest_file_url(prefix: str) -> str:
    files = list_s3_objects(prefix)
    if not files:
        return None
    latest_key = files[-1]
    return f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{latest_key}"

def upload_file_to_s3(file: UploadFile, key: str) -> str:
    file.file.seek(0)
    s3_client.upload_fileobj(file.file, SUPABASE_BUCKET, key)
    return f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{key}"

def upload_image_to_s3(img_array: np.ndarray, key: str) -> str:
    _, buffer = cv2.imencode(".jpg", img_array)
    s3_client.put_object(Bucket=SUPABASE_BUCKET, Key=key, Body=buffer.tobytes(), ACL="public-read")
    return f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{key}"

def to_numpy_boxes(result) -> np.ndarray:
    if result.boxes is None or result.boxes.data is None:
        return np.zeros((0,6), dtype=float)
    arr = result.boxes.data.cpu().numpy() if hasattr(result.boxes.data, 'cpu') else np.array(result.boxes.data)
    if arr.shape[1] < 6:
        arr = np.pad(arr, ((0,0),(0,6-arr.shape[1])), mode="constant")
    return arr[:, :6]

def total_area_xyxy(boxes: np.ndarray) -> float:
    if boxes.size == 0:
        return 0.0
    x1, y1, x2, y2 = boxes[:,0], boxes[:,1], boxes[:,2], boxes[:,3]
    w = np.maximum(0, x2 - x1)
    h = np.maximum(0, y2 - y1)
    return float(np.sum(w*h))

def iou_first_box(a: np.ndarray, b: np.ndarray) -> float:
    if a.size == 0 or b.size == 0:
        return None
    ax1, ay1, ax2, ay2 = a[0,:4]
    bx1, by1, bx2, by2 = b[0,:4]
    xA, yA = max(ax1, bx1), max(ay1, by1)
    xB, yB = min(ax2, bx2), min(ay2, by2)
    inter = max(0, xB - xA) * max(0, yB - yA)
    areaA = (ax2-ax1)*(ay2-ay1)
    areaB = (bx2-bx1)*(by2-by1)
    denom = areaA + areaB - inter
    return float(inter/denom) if denom>0 else None

# ---------- API Routes ----------
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
        contents = await file.read()
        np_arr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image")

        results_list = biopsy_model.predict(source=img, imgsz=640)
        result = results_list[0]
        boxes = to_numpy_boxes(result)
        is_cancerous = any(int(cls) in CANCER_CLASSES for cls in boxes[:,5].tolist()) if boxes.size else False
        annotated_img = result.plot()

        original_key = f"{patientId}/biopsy/{file.filename}"
        annotated_key = f"{patientId}/biopsy/annotated_{file.filename}"

        original_url = upload_file_to_s3(file, original_key)
        annotated_url = upload_image_to_s3(annotated_img, annotated_key)

        with open(CSV_FILE, "a", newline="") as f:
            csv.writer(f).writerow([patientId, name, age, weight, height, file.filename, "Yes" if is_cancerous else "No"])

        return {"patient_id": patientId, "is_cancerous": is_cancerous,
                "original_file": original_url, "annotated_file": annotated_url}

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict-mammography")
async def predict_mammography(file: UploadFile, patientId: str = Form(...)):
    try:
        contents = await file.read()
        np_arr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        results_list = mammo_model.predict(source=img, imgsz=640)
        result = results_list[0]
        boxes = to_numpy_boxes(result)
        is_cancerous = any(int(cls) in CANCER_CLASSES for cls in boxes[:,5].tolist()) if boxes.size else False
        annotated_img = result.plot()

        original_key = f"{patientId}/mammography/{file.filename}"
        annotated_key = f"{patientId}/mammography/annotated_{file.filename}"

        original_url = upload_file_to_s3(file, original_key)
        annotated_url = upload_image_to_s3(annotated_img, annotated_key)

        return {"patient_id": patientId, "is_cancerous": is_cancerous,
                "original_file": original_url, "annotated_file": annotated_url}

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/latest-biopsy-image/{patientId}")
async def latest_biopsy_image(patientId: str):
    url = get_latest_file_url(f"{patientId}/biopsy/")
    return JSONResponse({"imageUrl": url})


@app.get("/latest-image/{patientId}")
async def latest_mammo_image(patientId: str):
    url = get_latest_file_url(f"{patientId}/mammography/")
    return JSONResponse({"imageUrl": url})


@app.get("/patients/recent")
def get_recent_patients():
    if not os.path.exists(CSV_FILE):
        return []
    df = pd.read_csv(CSV_FILE)
    return df.tail(6).to_dict(orient="records")


@app.get("/patients")
def get_patients(patient_id: str = None):
    if not os.path.exists(CSV_FILE):
        return []
    df = pd.read_csv(CSV_FILE)
    if patient_id:
        results = df[df["patient_id"].astype(str).str.contains(str(patient_id), case=False, na=False)]
        return results.to_dict(orient="records")
    return df.to_dict(orient="records")
