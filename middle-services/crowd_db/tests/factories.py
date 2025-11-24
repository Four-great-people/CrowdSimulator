from bson import ObjectId
from db.models import MapDoc, Point, Segment, NamedPointSpec, GroupSpec

def make_test_mapdoc() -> MapDoc:
    return MapDoc(
        name="Тестовая карта",
        up_right_point=Point(10, 10),
        down_left_point=Point(0, 0),
        borders=[Segment(Point(0, 0), Point(10, 0))],
        persons=[NamedPointSpec(id=0, position=Point(0, 1))],
        goals=[NamedPointSpec(id=0, position=Point(1, 1))],
        groups=[GroupSpec(id=0, start_position=Point(2,2), total_count=5, person_ids=[1,2,3,4,5])]
        user_id=ObjectId(),
    )
