from datetime import datetime

# No SQLAlchemy, MongoDB documents will be dictionaries

# Doctor Document Example
# db.doctors.insert_one({
#     "name": "Dr. Smith",
#     "doctor_uid": "DOC1001",
#     "password_hash": "<hashed_password>"
# })

# Patient Document Example
# db.patients.insert_one({
#     "patient_uid": "PAT-XXXXXX",
#     "name": "Jane Doe",
#     "age": 45,
#     "phone": "1234567890",
#     "email": "jane@example.com",
#     "doctor_review": "Initial review",
#     "prev_doctor_name": None,
#     "prev_doctor_history": "NA",
#     "prev_medicine_history": "None",
#     "has_cancer": False,
#     "biopsy_image_path": None,
#     "last_visit": datetime.utcnow(),
#     "doctor_uid": "DOC1001",
#     "mammograms": [
#         {"image_path": "/uploads/PAT-XXXX/mammogram1.jpg", "created_at": datetime.utcnow()},
#     ]
# })

# Mammograms are now embedded inside the patient document as an array of dicts
