from dataclasses import dataclass, field
from typing import Any, Dict, List, Tuple
from bson import ObjectId


@dataclass(frozen=True)
class Point:
    x: int
    y: int

    def to_bson(self) -> Dict[str, int]:
        return {"x": int(self.x), "y": int(self.y)}

    @staticmethod
    def from_bson(d: Dict[str, Any]) -> "Point":
        return Point(int(d["x"]), int(d["y"]))


@dataclass(frozen=True)
class Segment:
    first: Point
    second: Point

    def to_bson(self) -> Dict[str, Dict[str, int]]:
        return {"first": self.first.to_bson(), "second": self.second.to_bson()}

    @staticmethod
    def from_bson(d: Dict[str, Any]) -> "Segment":
        return Segment(Point.from_bson(d["first"]), Point.from_bson(d["second"]))


@dataclass
class GridMap:
    """
    Map structure:
    - borders: lower_left and upper_right 
    - obstacles: list of segment-obstacles
    - metadata: name/description/etc.
    """
    name: str
    lower_left: Point = field(default_factory=lambda: Point(-50, -50))
    upper_right: Point = field(default_factory=lambda: Point(50, 50))
    borders: List[Segment] = field(default_factory=list)
    description: str | None = None
    _id: ObjectId | None = None

    def to_bson(self) -> Dict[str, Any]:
        return {
            "_id": self._id if self._id else ObjectId(),
            "name": self.name,
            "lower_left": self.lower_left.to_bson(),
            "upper_right": self.upper_right.to_bson(),
            "borders": [s.to_bson() for s in self.borders],
            "description": self.description,
        }

    @staticmethod
    def from_bson(d: Dict[str, Any]) -> "GridMap":
        return GridMap(
            name=d["name"],
            lower_left=Point.from_bson(d["lower_left"]),
            upper_right=Point.from_bson(d["upper_right"]),
            borders=[Segment.from_bson(s) for s in d.get("borders", [])],
            description=d.get("description"),
            _id=d.get("_id"),
        )

