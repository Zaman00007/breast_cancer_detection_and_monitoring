from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from auth import bp as auth_bp
from patients import bp as patients_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)
    JWTManager(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(patients_bp)

    @app.get("/health")
    def health():
        return jsonify({"status": "ok"})

    return app

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
