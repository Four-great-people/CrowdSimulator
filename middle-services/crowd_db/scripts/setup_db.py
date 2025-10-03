"""
Run:  python -m middle-sevices.crowd_db.scripts.setup_db
"""
from crowd_db.db.validators import apply_collection_validator

if __name__ == "__main__":
    apply_collection_validator()
    print("✅ MongoDB: validator applied.")
