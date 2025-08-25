import os

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "f3a1b5c8d9e2f6a7b4c3d8e9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7u8f9m9")
    MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://muditabhathar2022:Mudita2022@cluster0.5fmmgar.mongodb.net/oncoVision?retryWrites=true&w=majority&appName=OncoVision")
    # MONGO_URI=os.getenv("MONGO_URI=mongodb+srv://mudita:45678123@cluster0.wzv52k3.mongodb.net/oncoVison?retryWrites=true&w=majority&appName=Cluster0")
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", os.path.join(os.path.dirname(__file__), "uploads"))
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}
    USE_FAKE_ML = os.getenv("USE_FAKE_ML", "true").lower() == "true"

# Predefined Doctor IDs for role-based access
PREDEFINED_DOCTOR_IDS = {
    "DOC1001", "DOC1002", "DOC1003", "DOC1004", "DOC1005",
    "DOC1006", "DOC1007", "DOC1008", "DOC1009", "DOC1010"
}
