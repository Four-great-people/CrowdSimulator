from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from .config import MONGODB_URI, DB_NAME

_client: MongoClient | None = None

def get_client() -> MongoClient:
    global _client
    if _client is None:
        _client = MongoClient(MONGODB_URI, uuidRepresentation="standard")
        try:
            _client.admin.command("ping")
        except ConnectionFailure as e:
            raise RuntimeError(f"MongoDB is not reachable: {e}")
    return _client

def get_db():
    return get_client()[DB_NAME]

