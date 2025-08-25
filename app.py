from fastapi import FastAPI, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
import csv

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

        file_path = os.path.join(patient_dir, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        is_cancerous = True  
        with open(CSV_FILE, mode="a", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([patientId, name, age, weight, height, file.filename, "Yes" if is_cancerous else "No"])

        return {"patient_id": patientId, "is_cancerous": is_cancerous}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
