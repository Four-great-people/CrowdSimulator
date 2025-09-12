from pymongo.collection import Collection
from .client import get_db
from .config import MAPS_COLLECTION

def apply_collection_validator():
    """
    JSON Schema-validator for maps collections.
    """
    db = get_db()
    schema = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["name", "lower_left", "upper_right", "borders"],
            "properties": {
                "name": {"bsonType": "string", "minLength": 1},
                "description": {"bsonType": ["string", "null"]},
                "lower_left": {
                    "bsonType": "object",
                    "required": ["x", "y"],
                    "properties": {"x": {"bsonType": "int"}, "y": {"bsonType": "int"}},
                },
                "upper_right": {
                    "bsonType": "object",
                    "required": ["x", "y"],
                    "properties": {"x": {"bsonType": "int"}, "y": {"bsonType": "int"}},
                },
                "borders": {
                    "bsonType": "array",
                    "items": {
                        "bsonType": "object",
                        "required": ["first", "second"],
                        "properties": {
                            "first": {
                                "bsonType": "object",
                                "required": ["x", "y"],
                                "properties": {"x": {"bsonType": "int"}, "y": {"bsonType": "int"}},
                            },
                            "second": {
                                "bsonType": "object",
                                "required": ["x", "y"],
                                "properties": {"x": {"bsonType": "int"}, "y": {"bsonType": "int"}},
                            },
                        },
                    },
                },
            },
        }
    }

    # creating collection with validator
    if MAPS_COLLECTION not in db.list_collection_names():
        db.create_collection(MAPS_COLLECTION, validator=schema)
    else:
        # update validator of already existing collection
        db.command("collMod", MAPS_COLLECTION, validator=schema)

