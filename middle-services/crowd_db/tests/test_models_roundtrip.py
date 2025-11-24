from db.models import Point, Segment, NamedPointSpec, MapDoc, GroupSpec
from .factories import make_test_mapdoc
def test_point_roundtrip():
    p = Point(1, -2)
    assert Point.from_bson(p.to_bson()) == p

def test_segment_roundtrip():
    s = Segment(Point(0, 0), Point(3, 4))
    again = Segment.from_bson(s.to_bson())
    assert again == s

def test_person_roundtrip_with_id_int():
    ps = NamedPointSpec(id=7, position=Point(0,1),)
    again = NamedPointSpec.from_bson(ps.to_bson())
    assert again.id == 7 and again.position == ps.position

def test_mapdoc_roundtrip():
    m = make_test_mapdoc()
    again = MapDoc.from_bson(m.to_bson())
    assert again.name == "Тестовая карта"
    assert again.up_right_point == m.up_right_point
    assert again.down_left_point == m.down_left_point
    assert again.borders == m.borders
    assert len(again.groups) == 1
    assert again.persons[0].position == m.persons[0].position
