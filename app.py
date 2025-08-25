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
        # Create patient biopsy folder
        patient_dir = os.path.join(UPLOAD_DIR, patientId, "biopsy")
        os.makedirs(patient_dir, exist_ok=True)

        # Save original image
        original_path = os.path.join(patient_dir, file.filename)
        with open(original_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Run YOLO prediction
        results = model.predict(original_path, imgsz=640)

        # Get predictions
        predictions = results[0].boxes.data.tolist()
        is_cancerous = any(int(pred[5]) in CANCER_CLASSES for pred in predictions)

        # Save annotated image in same biopsy folder
        annotated_img = results[0].plot()
        annotated_file_path = os.path.join(patient_dir, "annotated_" + file.filename)
        cv2.imwrite(annotated_file_path, annotated_img)

        # Save patient info to CSV
        with open(CSV_FILE, mode="a", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([
                patientId,
                name,
                age,
                weight,
                height,
                file.filename,  # Original file
                "Yes" if is_cancerous else "No"
            ])

        return {
            "patient_id": patientId,
            "is_cancerous": is_cancerous,
            "original_file": original_path,
            "annotated_file": annotated_file_path
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
