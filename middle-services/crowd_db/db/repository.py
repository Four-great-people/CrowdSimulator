from typing import List, Optional
from bson import ObjectId
from bson.errors import InvalidId
from pymongo.collection import Collection
from .client import get_db
from .config import MAPS_COLLECTION, ANIMATIONS_COLLECTION
from .models import MapDoc, AnimationDoc

def _col() -> Collection:
    return get_db()[MAPS_COLLECTION]

def _animations_col() -> Collection:
    return get_db()[ANIMATIONS_COLLECTION]

class MongoMapRepository:
    def create(self, m: MapDoc) -> ObjectId:
        doc = m.to_bson()
        _col().insert_one(doc)
        return doc["_id"]

    def get(self, map_id: str | ObjectId) -> Optional[MapDoc]:
        try:
            oid = ObjectId(map_id) if isinstance(map_id, str) else map_id
        except InvalidId:
            return None
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
    
    def create_animation(self, animation_data: dict) -> ObjectId:
        animation_doc = AnimationDoc.from_bson(animation_data)
        doc = animation_doc.to_bson()
        _animations_col().insert_one(doc)
        return doc["_id"]

    def get_animation(self, animation_id: str | ObjectId) -> Optional[AnimationDoc]:
        try:
            oid = ObjectId(animation_id) if isinstance(animation_id, str) else animation_id
        except InvalidId:
            return None
        d = _animations_col().find_one({"_id": oid})
        return AnimationDoc.from_bson(d) if d else None

    def get_animations(self, limit: int = 1000) -> List[AnimationDoc]:
        return [AnimationDoc.from_bson(d) for d in _animations_col().find().limit(limit)]

    def update_animation(self, animation_id: str | ObjectId, animation_data: dict) -> bool:
        try:
            animation_doc = AnimationDoc.from_bson(animation_data)
            oid = ObjectId(animation_id) if isinstance(animation_id, str) else animation_id
        except (InvalidId, Exception):
            return False
        
        result = _animations_col().replace_one({"_id": oid}, animation_doc.to_bson())
        return result.matched_count == 1

    def delete_animation(self, animation_id: str | ObjectId) -> bool:
        try:
            oid = ObjectId(animation_id) if isinstance(animation_id, str) else animation_id
        except InvalidId:
            return False
        result = _animations_col().delete_one({"_id": oid})
        return result.deleted_count == 1
    