from db.models import Point, Segment, NamedPointSpec, MapDoc

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
    m = MapDoc(
        name="Тестовая карта",
        up_right_point=Point(10, 10),
        down_left_point=Point(0, 0),
        borders=[Segment(Point(0,0), Point(10,0))],
        persons=[NamedPointSpec(id=None, position=Point(0,1))],
        goals=[NamedPointSpec(id=None, position=Point(1,1))],
    )
    again = MapDoc.from_bson(m.to_bson())
    assert again.name == "Тестовая карта"
    assert again.up_right_point == m.up_right_point
    assert again.down_left_point == m.down_left_point
    assert again.borders == m.borders
    assert again.persons[0].position == m.persons[0].position
