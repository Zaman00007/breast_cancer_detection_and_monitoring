# extensions.py
from pymongo import MongoClient
import certifi
from config import Config

db_client = MongoClient(
    Config.MONGO_URI,
    tls=True,                   # ensures TLS
    tlsAllowInvalidCertificates=False,  # optional, stricter security
    tlsCAFile=certifi.where(),  # trusted CA bundle
    serverSelectionTimeoutMS=5000  # fail fast if can't connect
)
db = db_client.get_database("oncoVision")
