from fastapi import FastAPI, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
import csv
from ultralytics import YOLO
import cv2

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
YOLO_WEIGHTS = "/home/zaman/Code/Breast_Cancer_Detection_and_Monitoring/runs/detect/train/weights/best.pt"

model = YOLO(YOLO_WEIGHTS)
CANCER_CLASSES = [0, 1, 2]

if not os.path.exists(CSV_FILE):
    with open(CSV_FILE, mode="w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["patient_id", "name", "age", "weight", "height", "biopsy_file", "is_cancerous"])

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
        os.makedirs(patient_dir, exist_ok=True)

        temp_path = os.path.join(patient_dir, "temp_" + file.filename)
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        results = model.predict(temp_path, imgsz=640, save=True, save_dir=patient_dir, exist_ok=True)

        # Get the predictions
        predictions = results[0].boxes.data.tolist()  # Each box: [x1, y1, x2, y2, confidence, class]
        is_cancerous = any(int(pred[5]) in CANCER_CLASSES for pred in predictions)

        # Save annotated image
        annotated_img = results[0].plot()  # Returns numpy array
        annotated_file_path = os.path.join(patient_dir, "annotated_" + file.filename)
        cv2.imwrite(annotated_file_path, annotated_img)

        # Save patient info to CSV
        with open(CSV_FILE, mode="a", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([patientId, name, age, weight, height, "annotated_" + file.filename, "Yes" if is_cancerous else "No"])

        os.remove(temp_path)

        return {"patient_id": patientId, "is_cancerous": is_cancerous, "annotated_file": annotated_file_path}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
