from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Union
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
class PersonSpec:
    id: Optional[Union[int, str]]
    position: Point
    goal: Point

    def to_bson(self) -> Dict[str, Any]:
        doc: Dict[str, Any] = {
            "position": self.position.to_bson(),
            "goal": self.goal.to_bson(),
        }
        if self.id is not None:
            doc["id"] = self.id
        return doc

    @staticmethod
    def from_bson(d: Dict[str, Any]) -> "PersonSpec":
        return PersonSpec(
            id=d.get("id"),
            position=Point.from_bson(d["position"]),
            goal=Point.from_bson(d["goal"]),
        )

@dataclass
class AnimationPersonSpec(PersonSpec):
    reachedGoal: bool = False

    def to_bson(self) -> Dict[str, Any]:
        doc = super().to_bson()
        doc["reachedGoal"] = self.reachedGoal
        return doc

    @staticmethod
    def from_bson(d: Dict[str, Any]) -> "AnimationPersonSpec":
        base_person = PersonSpec.from_bson(d)
        return AnimationPersonSpec(
            id=base_person.id,
            position=base_person.position,
            goal=base_person.goal,
            reachedGoal=d.get("reachedGoal", False)
        )

@dataclass
class Hotspot:
    x: int
    y: int
    usedTicks: int

    def to_bson(self) -> Dict[str, Any]:
        return {
            "x": self.x,
            "y": self.y, 
            "usedTicks": self.usedTicks
        }

    @staticmethod
    def from_bson(d: Dict[str, Any]) -> "Hotspot":
        return Hotspot(
            x=int(d["x"]),
            y=int(d["y"]),
            usedTicks=int(d["usedTicks"])
        )

@dataclass
class MapDoc:
    up_right_point: Point
    down_left_point: Point
    borders: List[Segment] = field(default_factory=list)
    persons: List[PersonSpec] = field(default_factory=list)
    _id: Optional[ObjectId] = None

    def to_bson(self) -> Dict[str, Any]:
        return {
            "_id": self._id if self._id else ObjectId(),
            "up_right_point": self.up_right_point.to_bson(),
            "down_left_point": self.down_left_point.to_bson(),
            "borders": [s.to_bson() for s in self.borders],
            "persons": [p.to_bson() for p in self.persons],
        }

    @staticmethod
    def from_bson(d: Dict[str, Any]) -> "MapDoc":
        return MapDoc(
            up_right_point=Point.from_bson(d["up_right_point"]),
            down_left_point=Point.from_bson(d["down_left_point"]),
            borders=[Segment.from_bson(s) for s in d.get("borders", [])],
            persons=[PersonSpec.from_bson(p) for p in d.get("persons", [])],
            _id=d.get("_id"),
        )

@dataclass
class AnimationDoc:
    up_right_point: Point
    down_left_point: Point
    borders: List[Segment] = field(default_factory=list)
    persons: List[AnimationPersonSpec] = field(default_factory=list)
    hotspots: List[Hotspot] = field(default_factory=list)
    totalTicks: int = 0
    _id: Optional[ObjectId] = None

    def to_bson(self) -> Dict[str, Any]:
        doc = {
            "up_right_point": self.up_right_point.to_bson(),
            "down_left_point": self.down_left_point.to_bson(),
            "borders": [s.to_bson() for s in self.borders],
            "persons": [p.to_bson() for p in self.persons],
            "hotspots": [h.to_bson() for h in self.hotspots],
            "totalTicks": self.totalTicks
        }
        if self._id:
            doc["_id"] = self._id
        return doc

    @staticmethod
    def from_bson(d: Dict[str, Any]) -> "AnimationDoc":
        return AnimationDoc(
            up_right_point=Point.from_bson(d["up_right_point"]),
            down_left_point=Point.from_bson(d["down_left_point"]),
            borders=[Segment.from_bson(s) for s in d.get("borders", [])],
            persons=[AnimationPersonSpec.from_bson(p) for p in d.get("persons", [])],
            hotspots=[Hotspot.from_bson(h) for h in d.get("hotspots", [])],
            totalTicks=d.get("totalTicks", 0),
            _id=d.get("_id")
        )