import pytest
from db.repository import MongoMapRepository
from db.models import MapDoc, Point, Segment, PersonSpec
from db.client import get_db
from db.config import MAPS_COLLECTION
from db.validators import apply_collection_validator

# run with:  pytest --integration
pytestmark = [
    pytest.mark.skipif(
        not getattr(pytest, "config").getoption("--integration"),
        reason="run with --integration"
    ),
]

@pytest.fixture(autouse=True)
def require_mongo(mongo_running):
    if not mongo_running:
        pytest.skip("MongoDB is not running")

@pytest.fixture(autouse=True)
def clean_and_validate():
    apply_collection_validator()
    get_db()[MAPS_COLLECTION].delete_many({})
    yield
    get_db()[MAPS_COLLECTION].delete_many({})

def test_insert_and_read_real_mongo():
    repo = MongoMapRepository()
    m = MapDoc(
        up_right_point=Point(5, 5),
        down_left_point=Point(0, 0),
        borders=[Segment(Point(0,0), Point(5,0))],
        persons=[PersonSpec(id="p-42", position=Point(0,1), goal=Point(1,1))]
    )
    _id = repo.create(m)
    got = repo.get(_id)
    assert got is not None
    assert got.persons[0].id == "p-42"

