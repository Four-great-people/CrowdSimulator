from dataclasses import dataclass, field
from typing import Any, List, Optional, Union, Dict

from bson import ObjectId
from werkzeug.security import check_password_hash, generate_password_hash


@dataclass(frozen=True)
class Point:
    x: int
    y: int

    def to_bson(self) -> dict[str, int]:
        return {"x": int(self.x), "y": int(self.y)}

    @staticmethod
    def from_bson(d: dict[str, Any]) -> "Point":
        return Point(int(d["x"]), int(d["y"]))


@dataclass(frozen=True)
class Segment:
    first: Point
    second: Point

    def to_bson(self) -> dict[str, dict[str, int]]:
        return {"first": self.first.to_bson(), "second": self.second.to_bson()}

    @staticmethod
    def from_bson(d: dict[str, Any]) -> "Segment":
        return Segment(Point.from_bson(d["first"]), Point.from_bson(d["second"]))


@dataclass
class NamedPointSpec:
    id: Optional[Union[int, str]]
    position: Point

    def to_bson(self) -> dict[str, Any]:
        doc: dict[str, Any] = {
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
class UserDoc:
    username: str
    password_hash: str
    _id: Optional[ObjectId] = None

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def get_id(self) -> Optional[ObjectId]:
        return self._id

    def to_bson(self) -> dict[str, Any]:
        doc: dict[str, Any] = {
            "username": self.username,
            "password_hash": self.password_hash,
        }
        if self._id:
            doc["_id"] = self._id
        return doc

    @staticmethod
    def from_bson(d: dict[str, Any]) -> "UserDoc":
        return UserDoc(
            username=d["username"],
            password_hash=d["password_hash"],
            _id=d.get("_id"),
        )


@dataclass
class MapDoc:
    up_right_point: Point
    down_left_point: Point
    borders: List[Segment] = field(default_factory=list)
    persons: List[NamedPointSpec] = field(default_factory=list)
    goals: List[NamedPointSpec] = field(default_factory=list)
    name: str = "Без названия"
    user_id: ObjectId
    _id: Optional[ObjectId] = None

    def to_bson(self) -> dict[str, Any]:
        doc: dict[str, Any] = {
            "_id": self._id if self._id else ObjectId(),
            "name": self.name,
            "up_right_point": self.up_right_point.to_bson(),
            "down_left_point": self.down_left_point.to_bson(),
            "borders": [s.to_bson() for s in self.borders],
            "persons": [p.to_bson() for p in self.persons],
            "goals": [p.to_bson() for p in self.goals],
        }
        if self.user_id is not None:
            doc["user_id"] = self.user_id
        return doc
    def set_id(self, oid: ObjectId) -> None:
        self._id = oid

    def get_id(self) -> Optional[ObjectId]:
        return self._id

    @staticmethod
    def from_bson(d: dict[str, Any]) -> "MapDoc":
        return MapDoc(
            up_right_point=Point.from_bson(d["up_right_point"]),
            down_left_point=Point.from_bson(d["down_left_point"]),
            borders=[Segment.from_bson(s) for s in d.get("borders", [])],
            persons=[NamedPointSpec.from_bson(p) for p in d.get("persons", [])],
            goals=[NamedPointSpec.from_bson(p) for p in d.get("goals", [])],
            name=d.get("name", "Без названия"),
            user_id=d["user_id"],
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
    name: str = "Без названия"
    user_id: ObjectId
    _id: Optional[ObjectId] = None

    def to_bson(self) -> Dict[str, Any]:
        doc: Dict[str, Any] = {
            "up_right_point": self.up_right_point.to_bson(),
            "down_left_point": self.down_left_point.to_bson(),
            "borders": [s.to_bson() for s in self.borders],
            "persons": [p.to_bson() for p in self.persons],
            "goals": [p.to_bson() for p in self.goals],
            "routes": self.routes,
            "statistics": self.statistics,
            "name": self.name,
        }
        if self.user_id is not None:
            doc["user_id"] = self.user_id
        if self._id:
            doc["_id"] = self._id
        return doc

    def get_id(self) -> Optional[ObjectId]:
        return self._id

    @staticmethod
    def from_bson(d: dict[str, Any]) -> "AnimationDoc":
        return AnimationDoc(
            up_right_point=Point.from_bson(d["up_right_point"]),
            down_left_point=Point.from_bson(d["down_left_point"]),
            borders=[Segment.from_bson(s) for s in d.get("borders", [])],
            persons=[NamedPointSpec.from_bson(p) for p in d.get("persons", [])],
            goals=[NamedPointSpec.from_bson(p) for p in d.get("goals", [])],
            routes=d.get("routes", []),
            statistics=d.get("statistics", {}),
            name=d.get("name", "Без названия"),
            user_id=d["user_id"],
            _id=d.get("_id"),
        )
