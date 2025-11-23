from db.repository import MongoMapRepository
from db.models import MapDoc, Point, Segment, NamedPointSpec
from bson import ObjectId
if __name__ == "__main__":
    repo = MongoMapRepository()
    user_id = ObjectId("000000000000000000000000")
    doc = MapDoc(
        up_right_point=Point(10, 10),
        down_left_point=Point(0, 0),
        user_id=user_id,
        borders=[
            Segment(Point(0, 0), Point(10, 0)),
            Segment(Point(10, 0), Point(10, 10)),
        ],
        persons=[
            NamedPointSpec(id=0, position=Point(0, 1)),
        ],
        goals=[
            NamedPointSpec(id=0, position=Point(1, 1)),
        ],
    )

    _id = repo.create(doc)
    print("✅ Inserted:", _id)
