import pytest

from db.repository import MongoMapRepository
from db.models import MapDoc, Point, Segment, NamedPointSpec

@pytest.mark.usefixtures("use_mongomock", "clean_maps_collection")
def test_crud_maps_unit():
    repo = MongoMapRepository()

    m = MapDoc(
        up_right_point=Point(10, 10),
        down_left_point=Point(0, 0),
        borders=[Segment(Point(0, 0), Point(10, 0))],
        persons=[NamedPointSpec(id=0, position=Point(0,1))],
        goals=[NamedPointSpec(id=0, position=Point(1,1))],
    )

    # create
    _id = repo.create(m)
    assert _id is not None

    # get
    got = repo.get(_id)
    assert got is not None
    assert got.up_right_point == Point(10,10)
    assert len(got.persons) == 1
    assert got.persons[0].position == Point(0,1)

    # list
    lst = repo.list(limit=10)
    assert any(doc._id == _id for doc in lst)

    # replace 
    got.persons.append(NamedPointSpec(id=1, position=Point(1,1)))
    assert repo.replace(got) is True
    got2 = repo.get(_id)
    assert got2 and len(got2.persons) == 2

    # delete
    assert repo.delete(_id) is True
    assert repo.get(_id) is None

