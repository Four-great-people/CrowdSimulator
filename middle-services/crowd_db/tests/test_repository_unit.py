import pytest
from db.repository import MongoMapRepository
from db.models import Point, NamedPointSpec, GroupSpec
from .factories import make_test_mapdoc
@pytest.mark.usefixtures("use_mongomock", "clean_maps_collection")
def test_crud_maps_unit():
    repo = MongoMapRepository()

    m = make_test_mapdoc()

    # create
    _id = repo.create(m)
    assert _id is not None

    # get
    got = repo.get(_id)
    assert got is not None
    assert got.name == "Тестовая карта"
    assert got.up_right_point == Point(10,10)
    assert len(got.persons) == 1
    assert len(got.groups) == 1
    assert got.persons[0].position == Point(0,1)

    # list
    lst = repo.list(limit=10)
    assert any(doc.get_id() == _id for doc in lst)

    # replace
    got.persons.append(NamedPointSpec(id=1, position=Point(1,1)))
    got.groups.append(GroupSpec(id=1, start_position=Point(3,3), total_count=2, person_ids=[200,201]))
    assert repo.replace(got) is True
    got2 = repo.get(_id)
    assert got2 and len(got2.persons) == 2
    assert got2 and len(got2.groups) == 2

    # delete
    assert repo.delete(_id) is True
    assert repo.get(_id) is None
