"""
Создаёт пример карты:
- прямоугольные границы (-5,-5) .. (5,5)
- одна вертикальная «стена» из сегмента (x=0, y=-5..5)
Запуск:  python -m scripts.seed_example_map
"""
from db.models import GridMap, Point, Segment
from db.repository import create_map

if __name__ == "__main__":
    lower = Point(-5, -5)
    upper = Point(5, 5)

    wall = Segment(Point(0, -5), Point(0, 5))

    m = GridMap(
        name="demo-5x5-wall",
        lower_left=lower,
        upper_right=upper,
        borders=[wall],
        description="Demo map with a vertical wall at x=0",
    )

    oid = create_map(m)
    print(f"✅ Inserted demo map _id={oid}")

