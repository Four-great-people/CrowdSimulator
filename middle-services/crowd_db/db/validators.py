from .client import get_db
from .config import ANIMATIONS_COLLECTION, MAPS_COLLECTION, USERS_COLLECTION


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

    map_schema = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["up_right_point", "down_left_point", "borders", "persons", "goals"],
            "properties": {
                "_id": {},
                "up_right_point": point,
                "down_left_point": point,
                "borders": {"bsonType": "array", "items": segment},
                "persons": {"bsonType": "array", "items": named_point},
                "goals": {"bsonType": "array", "items": named_point},
                "name": {"bsonType": "string"},
                "user_id": {"bsonType": "objectId"},
            },
            "additionalProperties": False,
        },
    }

    animation_schema = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": [
                "up_right_point",
                "down_left_point",
                "borders",
                "persons",
                "goals",
                "routes",
                "statistics",
            ],
            "properties": {
                "_id": {},
                "up_right_point": point,
                "down_left_point": point,
                "borders": {"bsonType": "array", "items": segment},
                "persons": {"bsonType": "array", "items": named_point},
                "goals": {"bsonType": "array", "items": named_point},
                "routes": {"bsonType": "array", "items": route_person},
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
