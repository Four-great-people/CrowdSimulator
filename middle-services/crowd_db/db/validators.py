from .client import get_db
from .config import ANIMATIONS_COLLECTION, MAPS_COLLECTION, USERS_COLLECTION, DRAFTS_COLLECTION


def apply_collection_validator():
    db = get_db()

    point = {
        "bsonType": "object",
        "required": ["x", "y"],
        "properties": {
            "x": {"bsonType": "int"},
            "y": {"bsonType": "int"},
        },
        "additionalProperties": False,
    }

    segment = {
        "bsonType": "object",
        "required": ["first", "second"],
        "properties": {
            "first": point,
            "second": point,
        },
        "additionalProperties": False,
    }

    named_point = {
        "bsonType": "object",
        "required": ["position"],
        "properties": {
            "id": {"bsonType": ["int", "string", "null"]},
            "position": point,
        },
        "additionalProperties": False,
    }

    route_person = {
        "bsonType": "object",
        "properties": {
            "id": {"bsonType": ["int", "string", "null"]},
            "route": {"bsonType": "array", "items": {"bsonType": "string"}},
        },
        "additionalProperties": True,
    }
    group_schema = {
        "bsonType": "object",
        "required": ["start_position", "total_count", "person_ids"],
        "properties": {
            "id": {"bsonType": ["int", "string", "null"]},
            "start_position": point,
            "total_count": {"bsonType": "int"},
            "person_ids": {"bsonType": "array", "items": {"bsonType": "int"}},
        },
        "additionalProperties": False,
    }

    statistics = {
        "bsonType": "object",
        "properties": {
            "valid": {
                "bsonType": "object",
                "properties": {
                    "value": {"bsonType": ["int", "null"]},
                    "problematic": {"bsonType": "int"},
                },
            },
            "ideal": {
                "bsonType": "object",
                "properties": {
                    "value": {"bsonType": ["int", "null"]},
                    "problematic": {"bsonType": "int"},
                },
            },
        },
        "additionalProperties": True,
    }

    draft_schema = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["borders", "persons", "goals"],
            "properties": {
                "_id": {},
                "counter": {"bsonType": "int"},
                "borders": {"bsonType": "array", "items": segment}, #
                "persons": {"bsonType": "array", "items": named_point}, #
                "goals": {"bsonType": "array", "items": named_point}, #
                "groups": {"bsonType": ["array", "null"], "items": group_schema}, #
            },
            "additionalProperties": False,
        },
    }

    map_schema = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["up_right_point", "down_left_point", "draft_id"],
            "properties": {
                "_id": {},
                "up_right_point": point,
                "down_left_point": point,
                "draft_id": {"bsonType": "objectId"},
                "name": {"bsonType": "string"},
                "user_id": {"bsonType": "objectId"},
            },
            "additionalProperties": False,
        },
    }

    block = {
        "bsonType": "object",
        "required": [
            "borders",
            "persons",
            "goals",
            "routes",
            "ticks",
        ],
        "properties": {
            "draft_id": {"bsonType": "objectId"},
            "routes": {"bsonType": "array", "items": route_person},
            "groups": {"bsonType": ["array", "null"], "items": group_schema},
            "ticks": {"bsonType": "int"},
        },
        "additionalProperties": False,
    }

    animation_schema = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": [
                "up_right_point",
                "down_left_point",
            ],
            "properties": {
                "_id": {},
                "up_right_point": point,
                "down_left_point": point,
                "blocks": {"bsonType": "array", "items": block},
                "statistics": statistics,
                "name": {"bsonType": "string"},
                "user_id": {"bsonType": "objectId"},
            },
            "additionalProperties": False,
        },
    }

    user_schema = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["username", "password_hash"],
            "properties": {
                "_id": {},
                "username": {"bsonType": "string"},
                "password_hash": {"bsonType": "string"},
            },
            "additionalProperties": False,
        },
    }

    if MAPS_COLLECTION not in db.list_collection_names():
        db.create_collection(MAPS_COLLECTION, validator=map_schema)
    else:
        db.command("collMod", MAPS_COLLECTION, validator=map_schema)

    if ANIMATIONS_COLLECTION not in db.list_collection_names():
        db.create_collection(ANIMATIONS_COLLECTION, validator=animation_schema)
    else:
        db.command("collMod", ANIMATIONS_COLLECTION, validator=animation_schema)

    if USERS_COLLECTION not in db.list_collection_names():
        db.create_collection(USERS_COLLECTION, validator=user_schema)
    else:
        db.command("collMod", USERS_COLLECTION, validator=user_schema)
    if DRAFTS_COLLECTION not in db.list_collection_names():
        db.create_collection(DRAFTS_COLLECTION, validator=draft_schema)
    else:
        db.command("collMod", DRAFTS_COLLECTION, validator=draft_schema)
