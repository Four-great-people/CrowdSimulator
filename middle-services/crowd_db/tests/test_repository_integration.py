import pytest
from bson import ObjectId
from db.models import MapDoc, Point, Segment, NamedPointSpec, GroupSpec
from db.client import get_db
from db.config import MAPS_COLLECTION
from db.repository import MongoMapRepository
from db.validators import apply_collection_validator

# run with:  pytest --integration
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
    get_db()[MAPS_COLLECTION].delete_many({})
    yield
    get_db()[MAPS_COLLECTION].delete_many({})

def test_insert_and_read_real_mongo():
    repo = MongoMapRepository()
    m = MapDoc(
        name="Тестовая карта",
        up_right_point=Point(5, 5),
        down_left_point=Point(0, 0),
        user_id=ObjectId(),
        borders=[Segment(Point(0,0), Point(5,0))],
        persons=[NamedPointSpec(id="p-42", position=Point(0,1))],
        goals=[NamedPointSpec(id="p-42", position=Point(1,1))],
        groups=[GroupSpec(id=0, start_position=Point(3,3), total_count=3, person_ids=[100,101,102])]
    )
    _id = repo.create(m)
    got = repo.get(_id)
    assert got is not None
    assert got.name == "Тестовая карта"
    assert got.persons[0].id == "p-42"
    assert len(got.groups) == 1
