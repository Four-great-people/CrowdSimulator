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
class NamedPointSpec:
    id: Optional[Union[int, str]]
    position: Point

    def to_bson(self) -> Dict[str, Any]:
        doc: Dict[str, Any] = {
            "position": self.position.to_bson(),
        }
        if self.id is not None:
            doc["id"] = self.id
        return doc

    @staticmethod
    def from_bson(d: Dict[str, Any]) -> "NamedPointSpec":
        return NamedPointSpec(
            id=d.get("id"),
            position=Point.from_bson(d["position"]),
        )

@dataclass
class MapDoc:
    up_right_point: Point
    down_left_point: Point
    borders: List[Segment] = field(default_factory=list)
    persons: List[NamedPointSpec] = field(default_factory=list)
    goals: List[NamedPointSpec] = field(default_factory=list)
    _id: Optional[ObjectId] = None

    def to_bson(self) -> Dict[str, Any]:
        return {
            "_id": self._id if self._id else ObjectId(),
            "up_right_point": self.up_right_point.to_bson(),
            "down_left_point": self.down_left_point.to_bson(),
            "borders": [s.to_bson() for s in self.borders],
            "persons": [p.to_bson() for p in self.persons],
            "goals": [p.to_bson() for p in self.goals],
        }

    @staticmethod
    def from_bson(d: Dict[str, Any]) -> "MapDoc":
        return MapDoc(
            up_right_point=Point.from_bson(d["up_right_point"]),
            down_left_point=Point.from_bson(d["down_left_point"]),
            borders=[Segment.from_bson(s) for s in d.get("borders", [])],
            persons=[NamedPointSpec.from_bson(p) for p in d.get("persons", [])],
            goals=[NamedPointSpec.from_bson(p) for p in d.get("goals", [])],
            _id=d.get("_id"),
        )

@dataclass
class AnimationDoc:
    up_right_point: Point
    down_left_point: Point
    borders: List[Segment] = field(default_factory=list)
    persons: List[NamedPointSpec] = field(default_factory=list)
    goals: List[NamedPointSpec] = field(default_factory=list)
    
    routes: List[Dict] = field(default_factory=list)
    statistics: Dict = field(default_factory=dict)
    
    _id: Optional[ObjectId] = None

    def to_bson(self) -> Dict[str, Any]:
        doc = {
            "up_right_point": self.up_right_point.to_bson(),
            "down_left_point": self.down_left_point.to_bson(),
            "borders": [s.to_bson() for s in self.borders],
            "persons": [p.to_bson() for p in self.persons],
            "goals": [p.to_bson() for p in self.goals],
            "routes": self.routes,
            "statistics": self.statistics
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
            persons=[NamedPointSpec.from_bson(p) for p in d.get("persons", [])],
            goals=[NamedPointSpec.from_bson(p) for p in d.get("goals", [])],
            routes=d.get("routes", []),
            statistics=d.get("statistics", {}),
            _id=d.get("_id")
        )