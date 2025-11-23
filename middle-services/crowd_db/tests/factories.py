from bson import ObjectId
from db.models import MapDoc, Point, Segment, NamedPointSpec

def make_test_mapdoc() -> MapDoc:
    return MapDoc(
        name="Тестовая карта",
        up_right_point=Point(10, 10),
        down_left_point=Point(0, 0),
        borders=[Segment(Point(0, 0), Point(10, 0))],
        persons=[NamedPointSpec(id=0, position=Point(0, 1))],
        goals=[NamedPointSpec(id=0, position=Point(1, 1))],
        user_id=ObjectId(),
    )
