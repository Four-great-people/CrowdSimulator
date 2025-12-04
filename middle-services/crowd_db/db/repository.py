from __future__ import annotations

from typing import Any, List, Optional

from bson import ObjectId
from bson.errors import InvalidId
from pymongo.collection import Collection

from .client import get_db, get_client
from .config import ANIMATIONS_COLLECTION, MAPS_COLLECTION, USERS_COLLECTION, DRAFTS_COLLECTION
from .models import AnimationDoc, MapDoc, UserDoc, replace_draft_ids_in_animation, transform_animation_to_db_schema, transform_to_db_schema, transform_from_db_schema


def _col() -> Collection:
    return get_db()[MAPS_COLLECTION]


def _animations_col() -> Collection:
    return get_db()[ANIMATIONS_COLLECTION]

def _drafts_col() -> Collection:
    return get_db()[DRAFTS_COLLECTION]

def _users_col() -> Collection:
    return get_db()[USERS_COLLECTION]


# must be called only inside transaction
def remove_draft(did: ObjectId, session: Any):
    d = _drafts_col().find_one({"_id": did}, session=session)
    if d is None:
        raise ValueError("draft not found")
    if d["counter"] == 1:
        _drafts_col().delete_one({"_id": did}, session=session)
    else:
        d["counter"] -= 1
        _drafts_col().replace_one({"_id": did}, d, session=session)

# must be called only inside transaction
def increment_draft(did: ObjectId, session: Any) -> dict:
    d = _drafts_col().find_one({"_id": did}, session=session)
    if d is None:
        raise ValueError("draft not found")
    d["counter"] += 1
    _drafts_col().replace_one({"_id": did}, d, session=session)
    return d

def get_map_or_block_bson(map_bson: dict) -> dict:
    d = _drafts_col().find_one({"_id": map_bson["draft_id"]})
    if d is None:
        raise ValueError("draft not found")
    transform_from_db_schema(map_bson, d)
    return map_bson

def get_fake_map_or_block_bson(map_bson: dict) -> dict:
    transform_from_db_schema(map_bson,
                         {
                             "borders": [],
                             "persons": [],
                             "goals": [],
                             "groups": [],
                         })
    return map_bson

def get_animation_bson(a: dict) -> dict:
    for block in a["blocks"]:
        get_map_or_block_bson(block)
    return a

def get_fake_animation_bson(a: dict) -> dict:
    for block in a["blocks"]:
        get_fake_map_or_block_bson(block)
    return a

class MongoMapRepository:
    def create(self, m: MapDoc) -> ObjectId:
        with get_client().start_session() as session:
            with session.start_transaction():
                doc = m.to_bson()
                draft = transform_to_db_schema(doc)
                _drafts_col().insert_one(draft, session=session)
                doc["draft_id"] = draft["_id"]
                _col().insert_one(doc, session=session)
                return doc["_id"]

    def get_map_for_user(self, map_id: str | ObjectId, user_id: ObjectId) -> Optional[MapDoc]:
        try:
            oid = ObjectId(map_id) if isinstance(map_id, str) else map_id
        except InvalidId:
            return None
        d = _col().find_one({"_id": oid, "user_id": user_id})
        return MapDoc.from_bson(get_map_or_block_bson(d)) if d else None

    def list_for_user(self, user_id: ObjectId, limit: int = 50) -> List[MapDoc]:
        return [
            MapDoc.from_bson(get_fake_map_or_block_bson(d))
            for d in _col().find({"user_id": user_id}).limit(limit)
        ]

    def replace_for_user(self, m: MapDoc, user_id: ObjectId) -> bool:
        with get_client().start_session() as session:
            with session.start_transaction():
                if not m.get_id():
                    raise ValueError("replace_for_user: _id required")
                old_map = _col().find_one({"_id": m.get_id(), "user_id": user_id}, session = session)
                if old_map is None:
                    raise ValueError("no such id")
                old_draft_id = old_map["draft_id"]
                d = m.to_bson()
                draft = transform_to_db_schema(d)
                _drafts_col().insert_one(draft, session=session)
                d["draft_id"] = draft["_id"]
                res = _col().replace_one(
                    {"_id": m.get_id(), "user_id": user_id},
                    d,
                    session=session
                )
                remove_draft(old_draft_id, session=session)
                return res.matched_count == 1

    def delete_for_user(self, map_id: str | ObjectId, user_id: ObjectId) -> bool:
        try:
            oid = ObjectId(map_id) if isinstance(map_id, str) else map_id
        except InvalidId:
            return False
        with get_client().start_session() as session:
            with session.start_transaction():
                old_map = _col().find_one({"_id": map_id, "user_id": user_id}, session = session)
                if old_map is None:
                    raise ValueError("no such id")
                old_draft_id = old_map["draft_id"]
                res = _col().delete_one({"_id": oid, "user_id": user_id}, session=session)
                remove_draft(old_draft_id, session=session)
                return res.deleted_count == 1

    # ------- Анимации -------

    def create_animation(self, animation_data: dict, map_id: str | ObjectId) -> ObjectId:
        map_id = ObjectId(map_id) if isinstance(map_id, str) else map_id
        with get_client().start_session() as session:
            with session.start_transaction():
                animation_doc = AnimationDoc.from_bson(animation_data)
                doc = animation_doc.to_bson()
                map_bson = _col().find_one({"_id": map_id, "user_id": animation_data["user_id"]}, session = session)
                if map_bson is None:
                    raise ValueError("no such id") # TODO if not found use the first one
                first_draft_id = map_bson["draft_id"]
                increment_draft(first_draft_id, session=session)
                drafts = transform_animation_to_db_schema(doc)
                drafts_copy = drafts[1:]
                for draft in drafts_copy:
                    _drafts_col().insert_one(draft, session=session)
                drafts_copy = [{"_id": first_draft_id}] + drafts
                replace_draft_ids_in_animation(doc, drafts_copy)
                _animations_col().insert_one(doc, session=session)
                return doc["_id"]

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
        return AnimationDoc.from_bson(get_animation_bson(d)) if d else None

    def get_animations_for_user(
        self,
        user_id: ObjectId,
        limit: int = 1000,
    ) -> List[AnimationDoc]:
        return [
            AnimationDoc.from_bson(get_fake_animation_bson(d))
            for d in _animations_col().find({"user_id": user_id}).limit(limit)
        ]

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

    def update_animation_for_user(
        self,
        animation_id: str,
        user_id: ObjectId,
        new_blocks: list, # TODO only one is ok!!!
        new_statistics: dict,
    ) -> bool:
        try:
            with get_client().start_session() as session:
                with session.start_transaction():
                    oid = ObjectId(animation_id) if isinstance(animation_id, str) else animation_id
                    d = _animations_col().find_one({"_id": oid, "user_id": user_id}, session=session)
                    if d is None:
                        return False
                    new_block = new_blocks[-1]
                    draft = transform_to_db_schema(new_block)
                    _drafts_col().insert_one(draft, session=session)
                    new_block["draft_id"] = draft["_id"]
                    result = _animations_col().update_one(
                        {"_id": oid, "user_id": user_id},
                        {"$set": {"blocks": d["blocks"] + [new_block], "statistics": new_statistics}},
                        session=session
                    )
                    return result.matched_count > 0
        except (InvalidId, Exception):  # noqa: BLE001
            return False

    def delete_animation_for_user(
        self,
        animation_id: str | ObjectId,
        user_id: ObjectId,
    ) -> bool:
        try:
            oid = ObjectId(animation_id) if isinstance(animation_id, str) else animation_id
        except InvalidId:
            return False
        with get_client().start_session() as session:
            with session.start_transaction():
                d = _animations_col().find_one({"_id": oid, "user_id": user_id}, session=session)
                if d is None:
                    return False
                result = _animations_col().delete_one(
                    {"_id": oid, "user_id": user_id}, session=session)
                remove_draft(d["draft_id"], session=session)
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
