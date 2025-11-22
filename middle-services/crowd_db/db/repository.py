from __future__ import annotations

from typing import List, Optional

from bson import ObjectId
from bson.errors import InvalidId
from pymongo.collection import Collection

from .client import get_db
from .config import ANIMATIONS_COLLECTION, MAPS_COLLECTION, USERS_COLLECTION
from .models import AnimationDoc, MapDoc, UserDoc


def _col() -> Collection:
    return get_db()[MAPS_COLLECTION]


def _animations_col() -> Collection:
    return get_db()[ANIMATIONS_COLLECTION]


def _users_col() -> Collection:
    return get_db()[USERS_COLLECTION]


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

    def get_for_user(self, map_id: str | ObjectId, user_id: ObjectId) -> Optional[MapDoc]:
        try:
            oid = ObjectId(map_id) if isinstance(map_id, str) else map_id
        except InvalidId:
            return None
        d = _col().find_one({"_id": oid, "user_id": user_id})
        return MapDoc.from_bson(d) if d else None

    def list(self, limit: int = 50) -> List[MapDoc]:
        return [MapDoc.from_bson(d) for d in _col().find().limit(limit)]

    def list_for_user(self, user_id: ObjectId, limit: int = 50) -> List[MapDoc]:
        return [
            MapDoc.from_bson(d)
            for d in _col().find({"user_id": user_id}).limit(limit)
        ]

    def replace(self, m: MapDoc) -> bool:
        if not m.get_id():
            raise ValueError("replace: _id required")
        res = _col().replace_one({"_id": m.get_id()}, m.to_bson())
        return res.matched_count == 1

    def replace_for_user(self, m: MapDoc, user_id: ObjectId) -> bool:
        if not m.get_id():
            raise ValueError("replace_for_user: _id required")
        res = _col().replace_one(
            {"_id": m.get_id(), "user_id": user_id},
            m.to_bson(),
        )
        return res.matched_count == 1

    def delete(self, map_id: str | ObjectId) -> bool:
        try:
            oid = ObjectId(map_id) if isinstance(map_id, str) else map_id
        except InvalidId:
            return False
        res = _col().delete_one({"_id": oid})
        return res.deleted_count == 1

    def delete_for_user(self, map_id: str | ObjectId, user_id: ObjectId) -> bool:
        try:
            oid = ObjectId(map_id) if isinstance(map_id, str) else map_id
        except InvalidId:
            return False
        res = _col().delete_one({"_id": oid, "user_id": user_id})
        return res.deleted_count == 1

    # ------- Анимации -------

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

    def get_animation_for_user(
        self,
        animation_id: str | ObjectId,
        user_id: ObjectId,
    ) -> Optional[AnimationDoc]:
        try:
            oid = ObjectId(animation_id) if isinstance(animation_id, str) else animation_id
        except InvalidId:
            return None
        d = _animations_col().find_one({"_id": oid, "user_id": user_id})
        return AnimationDoc.from_bson(d) if d else None

    def get_animations(self, limit: int = 1000) -> List[AnimationDoc]:
        return [AnimationDoc.from_bson(d) for d in _animations_col().find().limit(limit)]

    def get_animations_for_user(
        self,
        user_id: ObjectId,
        limit: int = 1000,
    ) -> List[AnimationDoc]:
        return [
            AnimationDoc.from_bson(d)
            for d in _animations_col().find({"user_id": user_id}).limit(limit)
        ]

    def update_animation_name(self, animation_id: str, new_name: str) -> bool:
        try:
            oid = ObjectId(animation_id) if isinstance(animation_id, str) else animation_id
            result = _animations_col().update_one(
                {"_id": oid},
                {"$set": {"name": new_name}},
            )
            return result.matched_count > 0
        except (InvalidId, Exception):  # noqa: BLE001
            return False

    def update_animation_name_for_user(
        self,
        animation_id: str,
        user_id: ObjectId,
        new_name: str,
    ) -> bool:
        try:
            oid = ObjectId(animation_id) if isinstance(animation_id, str) else animation_id
            result = _animations_col().update_one(
                {"_id": oid, "user_id": user_id},
                {"$set": {"name": new_name}},
            )
            return result.matched_count > 0
        except (InvalidId, Exception):  # noqa: BLE001
            return False

    def delete_animation(self, animation_id: str | ObjectId) -> bool:
        try:
            oid = ObjectId(animation_id) if isinstance(animation_id, str) else animation_id
        except InvalidId:
            return False
        result = _animations_col().delete_one({"_id": oid})
        return result.deleted_count == 1

    def delete_animation_for_user(
        self,
        animation_id: str | ObjectId,
        user_id: ObjectId,
    ) -> bool:
        try:
            oid = ObjectId(animation_id) if isinstance(animation_id, str) else animation_id
        except InvalidId:
            return False
        result = _animations_col().delete_one({"_id": oid, "user_id": user_id})
        return result.deleted_count == 1


class MongoUserRepository:
    def create(self, user: UserDoc) -> ObjectId:
        doc = user.to_bson()
        _users_col().insert_one(doc)
        return doc["_id"]

    def get(self, user_id: str | ObjectId) -> Optional[UserDoc]:
        try:
            oid = ObjectId(user_id) if isinstance(user_id, str) else user_id
        except InvalidId:
            return None
        d = _users_col().find_one({"_id": oid})
        return UserDoc.from_bson(d) if d else None

    def get_by_username(self, username: str) -> Optional[UserDoc]:
        d = _users_col().find_one({"username": username})
        return UserDoc.from_bson(d) if d else None
