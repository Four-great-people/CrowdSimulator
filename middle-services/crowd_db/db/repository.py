
import builtins

from bson import ObjectId
from bson.errors import InvalidId
from pymongo.collection import Collection

from .client import get_db
from .config import ANIMATIONS_COLLECTION, MAPS_COLLECTION
from .models import AnimationDoc, MapDoc


def _col() -> Collection:
    return get_db()[MAPS_COLLECTION]

def _animations_col() -> Collection:
    return get_db()[ANIMATIONS_COLLECTION]

class MongoMapRepository:
    def create(self, m: MapDoc) -> ObjectId:
        doc = m.to_bson()
        _col().insert_one(doc)
        return doc["_id"]

    def get(self, map_id: str | ObjectId) -> MapDoc | None:
        try:
            oid = ObjectId(map_id) if isinstance(map_id, str) else map_id
        except InvalidId:
            return None
        d = _col().find_one({"_id": oid})
        return MapDoc.from_bson(d) if d else None

    def list(self, limit: int = 50) -> list[MapDoc]:
        return [MapDoc.from_bson(d) for d in _col().find().limit(limit)]

    def replace(self, m: MapDoc) -> bool:
        if not m.get_id():
            raise ValueError("replace: _id required")
        res = _col().replace_one({"_id": m.get_id()}, m.to_bson())
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

    def get_animation(self, animation_id: str | ObjectId) -> AnimationDoc | None:
        try:
            oid = ObjectId(animation_id) if isinstance(animation_id, str) else animation_id
        except InvalidId:
            return None
        d = _animations_col().find_one({"_id": oid})
        return AnimationDoc.from_bson(d) if d else None

    def get_animations(self, limit: int = 1000) -> builtins.list[AnimationDoc]:
        return [AnimationDoc.from_bson(d) for d in _animations_col().find().limit(limit)]

    def update_animation_name(self, animation_id: str , new_name: str) -> bool:
        try:
            oid = ObjectId(animation_id) if isinstance(animation_id, str) else animation_id
            result = _animations_col().update_one(
                {"_id": oid},
                {"$set": {"name": new_name}}
            )
            return result.matched_count > 0
        except (InvalidId, Exception):
            return False


    def delete_animation(self, animation_id: str | ObjectId) -> bool:
        try:
            oid = ObjectId(animation_id) if isinstance(animation_id, str) else animation_id
        except InvalidId:
            return False
        result = _animations_col().delete_one({"_id": oid})
        return result.deleted_count == 1
