import pytest
from db.client import get_db
from db.config import MAPS_COLLECTION
from db.validators import apply_collection_validator
from pymongo.errors import WriteError

# pylint: disable=duplicate-code
pytestmark = [
    pytest.mark.skipif(
        not pytest.config.getoption("--integration"),
        reason="run with --integration",
    ),
]

@pytest.fixture(autouse=True)
def require_mongo(mongo_running):
    if not mongo_running:
        pytest.skip("MongoDB is not running")

@pytest.fixture(autouse=True)
def clean_and_validate():
    apply_collection_validator()
    col = get_db()[MAPS_COLLECTION]
    col.delete_many({})
    yield
    col.delete_many({})

def test_json_schema_blocks_bad_doc_missing_required():
    col = get_db()[MAPS_COLLECTION]
    bad = {
        "borders": [],
        "persons": [],
    }
    with pytest.raises(WriteError) as e:
        col.insert_one(bad)
    assert e.value.code in (121, None)

def test_json_schema_allows_id_types():
    col = get_db()[MAPS_COLLECTION]
    good = {
        "up_right_point": {"x": 10, "y": 10},
        "down_left_point": {"x": 0, "y": 0},
        "borders": [],
        "persons": [
            {"id": 0, "position": {"x": 0, "y": 1}, "goal": {"x": 1, "y": 1}},
            {"id": "user-1", "position": {"x": 1, "y": 1}, "goal": {"x": 2, "y": 2}},
            {"position": {"x": 2, "y": 2}, "goal": {"x": 3, "y": 3}},
        ],
    }
    # не должно кидать
    res = col.insert_one(good)
    assert res.inserted_id is not None
