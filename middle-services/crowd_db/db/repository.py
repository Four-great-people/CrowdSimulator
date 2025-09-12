from typing import Iterable, List, Optional
from bson import ObjectId
from pymongo.collection import Collection
from .client import get_db
from .config import MAPS_COLLECTION
from .models import GridMap

def _col() -> Collection:
    return get_db()[MAPS_COLLECTION]

# --- Indexes (call once during initialization) ---
def ensure_indexes() -> None:
    # unique map names
    _col().create_index("name", unique=True)

# --- CRUD operations for maps ---
def create_map(m: GridMap) -> ObjectId:
    doc = m.to_bson()
    _col().insert_one(doc)
    return doc["_id"]

def get_map(map_id: str | ObjectId) -> Optional[GridMap]:
    oid = ObjectId(map_id) if isinstance(map_id, str) else map_id
    doc = _col().find_one({"_id": oid})
    return GridMap.from_bson(doc) if doc else None

def get_map_by_name(name: str) -> Optional[GridMap]:
    doc = _col().find_one({"name": name})
    return GridMap.from_bson(doc) if doc else None

def list_maps(limit: int = 50) -> List[GridMap]:
    return [GridMap.from_bson(d) for d in _col().find().limit(limit)]

def delete_map(map_id: str | ObjectId) -> bool:
    oid = ObjectId(map_id) if isinstance(map_id, str) else map_id
    res = _col().delete_one({"_id": oid})
    return res.deleted_count == 1

def replace_map(m: GridMap) -> bool:
    """Full replacement by _id"""
    if not m._id:
        raise ValueError("replace_map: _id is required")
    res = _col().replace_one({"_id": m._id}, m.to_bson())
    return res.modified_count == 1

