from db.repository import MongoMapRepository
from db.models import MapDoc, Point, Segment, PersonSpec

if __name__ == "__main__":
    repo = MongoMapRepository()

    doc = MapDoc(
        up_right_point=Point(10, 10),
        down_left_point=Point(0, 0),
        borders=[
            Segment(Point(0, 0), Point(10, 0)),
            Segment(Point(10, 0), Point(10, 10)),
        ],
        persons=[
            PersonSpec(id=0, position=Point(0, 1), goal=Point(1, 1)),
        ],
    )

    _id = repo.create(doc)
    print("✅ Inserted:", _id)
