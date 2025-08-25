# auth.py
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from extensions import db

bp = Blueprint("auth", __name__, url_prefix="/auth")

@bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    doctor_id = data.get("doctor_id")
    password = data.get("password")

    if db.doctors.find_one({"doctor_uid": doctor_id}):
        return jsonify({"error": "Doctor ID already exists"}), 409

    hashed = generate_password_hash(password)
    db.doctors.insert_one({"doctor_uid": doctor_id, "password_hash": hashed})
    return jsonify({"message": "Registered successfully"}), 201

@bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    doctor_id = data.get("doctor_id")
    password = data.get("password")

    doctor = db.doctors.find_one({"doctor_uid": doctor_id})
    if not doctor:
        return jsonify({"error": "Doctor not found"}), 404
    if not check_password_hash(doctor["password_hash"], password):
        return jsonify({"error": "Invalid password"}), 401

    token = create_access_token(identity=doctor_id)
    return jsonify({"access_token": token}), 200
