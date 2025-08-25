# import os, uuid
# from datetime import datetime
# from flask import Blueprint, request, jsonify, current_app
# from flask_jwt_extended import jwt_required, get_jwt_identity
# from werkzeug.utils import secure_filename
# from extensions import db
# from ml import run_biopsy_yolo, analyze_mammograms

# bp = Blueprint("patients", __name__, url_prefix="/patients")
# ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}

# def allowed(filename):
#     return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

# @bp.get("/recent")
# @jwt_required()
# def recent():
#     ident = get_jwt_identity()
#     doctor_uid = ident["doctor_uid"]
#     items = list(db.patients.find({"doctor_uid": doctor_uid}).sort("last_visit", -1).limit(12))
#     return jsonify([serialize_patient(p) for p in items])

# @bp.get("")
# @jwt_required()
# def search():
#     ident = get_jwt_identity()
#     doctor_uid = ident["doctor_uid"]
#     q = request.args.get("search", "").strip()
#     if not q:
#         return jsonify([])
#     items = list(db.patients.find({
#         "doctor_uid": doctor_uid,
#         "name": {"$regex": q, "$options": "i"}
#     }).sort("last_visit", -1))
#     return jsonify([serialize_patient(p) for p in items])

# # -------------------- Create Patient --------------------
# @bp.post("")
# @jwt_required()
# def create_patient():
#     ident = get_jwt_identity()
#     doctor_uid = ident["doctor_uid"]
#     data = request.form if request.form else request.json
#     name = (data.get("name") or "").strip()
#     age = int(data.get("age") or 0)
#     phone = (data.get("phone") or "").strip()
#     email = (data.get("email") or "").strip()
#     doctor_review = (data.get("doctor_review") or "").strip()
#     prev_doctor_name = (data.get("prev_doctor_name") or "").strip()
#     prev_doctor_history = (data.get("prev_doctor_history") or "").strip() or "NA"
#     prev_medicine_history = (data.get("prev_medicine_history") or "").strip()

#     if not all([name, age, phone, email, doctor_review, prev_medicine_history]):
#         return jsonify({"error": "Missing required fields"}), 400

#     patient_uid = f"PAT-{uuid.uuid4().hex[:8].upper()}"
#     patient = {
#         "patient_uid": patient_uid,
#         "name": name,
#         "age": age,
#         "phone": phone,
#         "email": email,
#         "doctor_review": doctor_review,
#         "prev_doctor_name": prev_doctor_name or None,
#         "prev_doctor_history": prev_doctor_history,
#         "prev_medicine_history": prev_medicine_history,
#         "doctor_uid": doctor_uid,
#         "has_cancer": False,
#         "last_visit": datetime.utcnow(),
#         "biopsy_image_path": None,
#         "mammograms": []
#     }
#     db.patients.insert_one(patient)
#     return jsonify(serialize_patient(patient)), 201

# # -------------------- Get Patient --------------------
# @bp.get("/<patient_uid>")
# @jwt_required()
# def get_patient(patient_uid):
#     ident = get_jwt_identity()
#     doctor_uid = ident["doctor_uid"]
#     p = db.patients.find_one({"patient_uid": patient_uid, "doctor_uid": doctor_uid})
#     if not p:
#         return jsonify({"error": "Patient not found"}), 404
#     return jsonify(serialize_patient(p, include_mammograms=True))

# # -------------------- Upload Biopsy --------------------
# @bp.post("/<patient_uid>/upload_biopsy")
# @jwt_required()
# def upload_biopsy(patient_uid):
#     ident = get_jwt_identity()
#     doctor_uid = ident["doctor_uid"]
#     p = db.patients.find_one({"patient_uid": patient_uid, "doctor_uid": doctor_uid})
#     if not p:
#         return jsonify({"error": "Patient not found"}), 404

#     if "file" not in request.files:
#         return jsonify({"error": "No file"}), 400
#     f = request.files["file"]
#     if not f or not allowed(f.filename):
#         return jsonify({"error": "Invalid file"}), 400

#     fn = secure_filename(f.filename)
#     folder = os.path.join(current_app.config["UPLOAD_FOLDER"], patient_uid)
#     os.makedirs(folder, exist_ok=True)
#     path = os.path.join(folder, f"biopsy_{fn}")
#     f.save(path)

#     db.patients.update_one(
#         {"patient_uid": patient_uid},
#         {"$set": {"biopsy_image_path": path, "last_visit": datetime.utcnow()}}
#     )
#     return jsonify({"message": "Uploaded", "path": path})

# # -------------------- Diagnose --------------------
# @bp.post("/<patient_uid>/diagnose")
# @jwt_required()
# def diagnose(patient_uid):
#     ident = get_jwt_identity()
#     doctor_uid = ident["doctor_uid"]
#     p = db.patients.find_one({"patient_uid": patient_uid, "doctor_uid": doctor_uid})
#     if not p:
#         return jsonify({"error": "Patient not found"}), 404
#     if not p.get("biopsy_image_path") or not os.path.exists(p["biopsy_image_path"]):
#         return jsonify({"error": "Biopsy image required"}), 400

#     res = run_biopsy_yolo(p["biopsy_image_path"])
#     has_cancer = bool(res.get("has_cancer"))
#     db.patients.update_one(
#         {"patient_uid": patient_uid},
#         {"$set": {"has_cancer": has_cancer, "last_visit": datetime.utcnow()}}
#     )
#     return jsonify({"has_cancer": has_cancer, "confidence": res.get("confidence")})

# # -------------------- Upload Mammogram --------------------
# @bp.post("/<patient_uid>/upload_mammogram")
# @jwt_required()
# def upload_mammogram(patient_uid):
#     ident = get_jwt_identity()
#     doctor_uid = ident["doctor_uid"]
#     p = db.patients.find_one({"patient_uid": patient_uid, "doctor_uid": doctor_uid})
#     if not p:
#         return jsonify({"error": "Patient not found"}), 404

#     if "file" not in request.files:
#         return jsonify({"error": "No file"}), 400
#     f = request.files["file"]
#     if not f or not allowed(f.filename):
#         return jsonify({"error": "Invalid file"}), 400

#     fn = secure_filename(f.filename)
#     folder = os.path.join(current_app.config["UPLOAD_FOLDER"], patient_uid)
#     os.makedirs(folder, exist_ok=True)
#     path = os.path.join(folder, f"mammogram_{uuid.uuid4().hex[:6]}_{fn}")
#     f.save(path)

#     db.patients.update_one(
#         {"patient_uid": patient_uid},
#         {"$push": {"mammograms": {"image_path": path, "created_at": datetime.utcnow()}},
#          "$set": {"last_visit": datetime.utcnow()}}
#     )
#     return jsonify({"message": "Uploaded", "path": path})

# # -------------------- Mammogram Analysis --------------------
# @bp.get("/<patient_uid>/analysis")
# @jwt_required()
# def analysis(patient_uid):
#     ident = get_jwt_identity()
#     doctor_uid = ident["doctor_uid"]
#     p = db.patients.find_one({"patient_uid": patient_uid, "doctor_uid": doctor_uid})
#     if not p:
#         return jsonify({"error": "Patient not found"}), 404
#     paths = [m["image_path"] for m in p.get("mammograms", [])]
#     res = analyze_mammograms(paths)
#     return jsonify(res)

# # -------------------- Serializer --------------------
# def serialize_patient(p, include_mammograms=False):
#     d = {
#         "patient_uid": p["patient_uid"],
#         "name": p["name"],
#         "age": p["age"],
#         "phone": p["phone"],
#         "email": p["email"],
#         "doctor_review": p.get("doctor_review"),
#         "prev_doctor_name": p.get("prev_doctor_name"),
#         "prev_doctor_history": p.get("prev_doctor_history"),
#         "prev_medicine_history": p.get("prev_medicine_history"),
#         "has_cancer": p.get("has_cancer", False),
#         "last_visit": p.get("last_visit").isoformat() if p.get("last_visit") else None,
#         "biopsy_image_path": p.get("biopsy_image_path")
#     }
#     if include_mammograms:
#         d["mammograms"] = [
#             {"image_path": m["image_path"], "created_at": m["created_at"].isoformat()}
#             for m in p.get("mammograms", [])
#         ]
#     return d



import os, uuid, json
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from extensions import db
from ml import run_biopsy_yolo, analyze_mammograms

bp = Blueprint("patients", __name__, url_prefix="/patients")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}

def allowed(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def get_relative_path(path):
    return os.path.relpath(path, current_app.config["UPLOAD_FOLDER"]).replace("\\", "/")

# -------------------- Recent Patients --------------------
@bp.get("/recent")
@jwt_required()
def recent():
    ident = json.loads(get_jwt_identity())
    doctor_uid = ident["doctor_uid"]
    items = list(db.patients.find({"doctor_uid": doctor_uid}).sort("last_visit", -1).limit(12))
    return jsonify([serialize_patient(p, include_mammograms=True) for p in items])

# -------------------- Search Patients --------------------
@bp.get("")
@jwt_required()
def search():
    ident = json.loads(get_jwt_identity())
    doctor_uid = ident["doctor_uid"]
    q = request.args.get("search", "").strip()
    if not q:
        return jsonify([])
    items = list(db.patients.find({
        "doctor_uid": doctor_uid,
        "name": {"$regex": q, "$options": "i"}
    }).sort("last_visit", -1))
    return jsonify([serialize_patient(p, include_mammograms=True) for p in items])

# -------------------- Create Patient --------------------
@bp.post("")
@jwt_required()
def create_patient():
    ident = json.loads(get_jwt_identity())
    doctor_uid = ident["doctor_uid"]
    data = request.form if request.form else request.json

    # Required fields
    name = (data.get("name") or "").strip()
    age = int(data.get("age") or 0)
    phone = (data.get("phone") or "").strip()
    email = (data.get("email") or "").strip()
    doctor_review = (data.get("doctor_review") or "").strip()
    prev_medicine_history = (data.get("prev_medicine_history") or "").strip()

    if not all([name, age, phone, email, doctor_review, prev_medicine_history]):
        return jsonify({"error": "Missing required fields"}), 400

    # Optional fields
    prev_doctor_name = (data.get("prev_doctor_name") or "").strip()
    prev_doctor_history = (data.get("prev_doctor_history") or "").strip() or "NA"

    patient_uid = f"PAT-{uuid.uuid4().hex[:8].upper()}"
    patient = {
        "patient_uid": patient_uid,
        "name": name,
        "age": age,
        "phone": phone,
        "email": email,
        "doctor_review": doctor_review,
        "prev_doctor_name": prev_doctor_name or None,
        "prev_doctor_history": prev_doctor_history,
        "prev_medicine_history": prev_medicine_history,
        "doctor_uid": doctor_uid,
        "has_cancer": False,
        "last_visit": datetime.utcnow(),
        "biopsy_image_path": None,
        "mammograms": []
    }

    db.patients.insert_one(patient)
    return jsonify(serialize_patient(patient, include_mammograms=True)), 201

# -------------------- Get Patient --------------------
@bp.get("/<patient_uid>")
@jwt_required()
def get_patient(patient_uid):
    ident = json.loads(get_jwt_identity())
    doctor_uid = ident["doctor_uid"]
    p = db.patients.find_one({"patient_uid": patient_uid, "doctor_uid": doctor_uid})
    if not p:
        return jsonify({"error": "Patient not found"}), 404
    return jsonify(serialize_patient(p, include_mammograms=True))

# -------------------- Upload Biopsy --------------------
@bp.post("/<patient_uid>/upload_biopsy")
@jwt_required()
def upload_biopsy(patient_uid):
    ident = json.loads(get_jwt_identity())
    doctor_uid = ident["doctor_uid"]
    p = db.patients.find_one({"patient_uid": patient_uid, "doctor_uid": doctor_uid})
    if not p:
        return jsonify({"error": "Patient not found"}), 404

    if "file" not in request.files:
        return jsonify({"error": "No file"}), 400
    f = request.files["file"]
    if not f or not allowed(f.filename):
        return jsonify({"error": "Invalid file"}), 400

    fn = secure_filename(f.filename)
    folder = os.path.join(current_app.config["UPLOAD_FOLDER"], patient_uid)
    os.makedirs(folder, exist_ok=True)
    path = os.path.join(folder, f"biopsy_{uuid.uuid4().hex[:6]}_{fn}")
    f.save(path)

    db.patients.update_one(
        {"patient_uid": patient_uid},
        {"$set": {"biopsy_image_path": path, "last_visit": datetime.utcnow()}}
    )

    return jsonify({"message": "Uploaded", "path": get_relative_path(path)})

# -------------------- Temporary Diagnosis (Before Patient Creation) --------------------
@bp.post("/temp_diagnose")
def temp_diagnose():
    if "file" not in request.files:
        return jsonify({"error": "No file"}), 400
    f = request.files["file"]
    if not f or not allowed(f.filename):
        return jsonify({"error": "Invalid file"}), 400

    tmp_path = os.path.join("tmp", f"{uuid.uuid4().hex}_{secure_filename(f.filename)}")
    os.makedirs("tmp", exist_ok=True)
    f.save(tmp_path)

    res = {"has_cancer": True, "confidence": 1.0, "prediction": "Cancer"}
    os.remove(tmp_path)
    return jsonify(res)

# -------------------- Serializer --------------------
def serialize_patient(p, include_mammograms=False):
    d = {
        "patient_uid": p["patient_uid"],
        "name": p["name"],
        "age": p["age"],
        "phone": p["phone"],
        "email": p["email"],
        "doctor_review": p.get("doctor_review"),
        "prev_doctor_name": p.get("prev_doctor_name"),
        "prev_doctor_history": p.get("prev_doctor_history"),
        "prev_medicine_history": p.get("prev_medicine_history"),
        "has_cancer": p.get("has_cancer", False),
        "last_visit": p.get("last_visit").isoformat() if p.get("last_visit") else None,
        "biopsy_image_path": get_relative_path(p["biopsy_image_path"]) if p.get("biopsy_image_path") else None
    }
    if include_mammograms:
        d["mammograms"] = [
            {"image_path": get_relative_path(m["image_path"]), "created_at": m["created_at"].isoformat()}
            for m in p.get("mammograms", [])
        ]
    return d
