from typing import List, Optional
from bson import ObjectId
from pymongo.collection import Collection
from .client import get_db
from .config import MAPS_COLLECTION
from .models import MapDoc

def _col() -> Collection:
    return get_db()[MAPS_COLLECTION]

class MongoMapRepository:
    def create(self, m: MapDoc) -> ObjectId:
        doc = m.to_bson()
        _col().insert_one(doc)
        return doc["_id"]

    def get(self, map_id: str | ObjectId) -> Optional[MapDoc]:
        oid = ObjectId(map_id) if isinstance(map_id, str) else map_id
        d = _col().find_one({"_id": oid})
        return MapDoc.from_bson(d) if d else None

    def list(self, limit: int = 50) -> List[MapDoc]:
        return [MapDoc.from_bson(d) for d in _col().find().limit(limit)]

    def replace(self, m: MapDoc) -> bool:
        if not m._id:
            raise ValueError("replace: _id required")
        res = _col().replace_one({"_id": m._id}, m.to_bson())
        return res.matched_count == 1

    def delete(self, map_id: str | ObjectId) -> bool:
        oid = ObjectId(map_id) if isinstance(map_id, str) else map_id
        res = _col().delete_one({"_id": oid})
        return res.deleted_count == 1

