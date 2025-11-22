import os

from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGODB_DB", "crowdsim")
MAPS_COLLECTION = os.getenv("MONGODB_COLLECTION_MAPS", "maps")
ANIMATIONS_COLLECTION = os.getenv("MONGODB_COLLECTION_ANIMATIONS", "animations")
USERS_COLLECTION = os.getenv("MONGODB_COLLECTION_USERS", "users")
