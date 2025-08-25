from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from io import BytesIO
from PIL import Image

app = FastAPI()

# Allow CORS so frontend can communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace * with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load YOLO model once at startup
model = YOLO("/home/zaman/Code/Cancer_Detection_System/runs/detect/train7/weights/best.pt")

@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    patientId: str = Form(...),
    name: str = Form(...),
    age: int = Form(...),
    weight: float = Form(...),
    height: float = Form(...)
):
    try:
        
        image_bytes = await file.read()
        img = Image.open(BytesIO(image_bytes)).convert("RGB")

    
        results = model.predict(img, imgsz=640, device=0)

        predictions = []
        for r in results:
            boxes = r.boxes
            for box in boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                conf = float(box.conf[0])
                cls = int(box.cls[0])
                predictions.append({
                    "class": cls,
                    "confidence": conf,
                    "bbox": [x1, y1, x2, y2]
                })

        
        is_cancerous = any(pred["class"] == 0 for pred in predictions)



        return JSONResponse(content={
            "patientId": patientId,
            "name": name,
            "age": age,
            "weight": weight,
            "height": height,
            "is_cancerous": is_cancerous,
            "predictions": predictions
        })
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
