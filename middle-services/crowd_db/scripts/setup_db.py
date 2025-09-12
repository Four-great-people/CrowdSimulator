"""
Run:  python -m middle-sevices.crowd_db.scripts.setup_db
"""
from db.repository import ensure_indexes
from db.validators import apply_collection_validator

if __name__ == "__main__":
    apply_collection_validator()
    ensure_indexes()
    print("✅ MongoDB: validator applied, indexes ensured.")

