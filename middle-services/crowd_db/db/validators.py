from .client import get_db
from .config import MAPS_COLLECTION

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

    person = {
        "bsonType": "object",
        "required": ["position", "goal"],
        "properties": {
            "id": {"bsonType": ["int", "string", "null"]},
            "position": point,
            "goal": point,
        },
        "additionalProperties": False,
    }

    schema = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["up_right_point", "down_left_point", "borders", "persons"],
            "properties": {
                "_id": {},
                "up_right_point": point,
                "down_left_point": point,
                "borders": {"bsonType": "array", "items": segment},
                "persons": {"bsonType": "array", "items": person},
            },
            "additionalProperties": False,
        }
    }

    if MAPS_COLLECTION not in db.list_collection_names():
        db.create_collection(MAPS_COLLECTION, validator=schema)
    else:
        db.command("collMod", MAPS_COLLECTION, validator=schema)

