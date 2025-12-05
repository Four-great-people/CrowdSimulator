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
class GroupSpec:
    id: Optional[Union[int, str]]
    start_position: Point
    total_count: int
    person_ids: List[int]
    def to_bson(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "start_position": self.start_position.to_bson(),
            "total_count": self.total_count,
            "person_ids": self.person_ids
        }

    @staticmethod
    def from_bson(d: Dict[str, Any]) -> "GroupSpec":
        return GroupSpec(
            id=d["id"],
            start_position=Point.from_bson(d["start_position"]),
            total_count=d["total_count"],
            person_ids=d["person_ids"]
        )

@dataclass
class MapDoc:
    up_right_point: Point
    down_left_point: Point
    user_id: ObjectId
    borders: List[Segment] = field(default_factory=list)
    persons: List[NamedPointSpec] = field(default_factory=list)
    goals: List[NamedPointSpec] = field(default_factory=list)
    groups: List[GroupSpec] = field(default_factory=list)
    name: str = "Без названия"
    _id: Optional[ObjectId] = None

    def set_id(self, oid: ObjectId) -> None:
        self._id = oid

    def get_id(self) -> Optional[ObjectId]:
        return self._id

    def to_bson(self) -> dict[str, Any]:
        doc: dict[str, Any] = {
            "up_right_point": self.up_right_point.to_bson(),
            "down_left_point": self.down_left_point.to_bson(),
            "borders": [s.to_bson() for s in self.borders],
            "persons": [p.to_bson() for p in self.persons],
            "goals": [p.to_bson() for p in self.goals],
            "groups": [g.to_bson() for g in self.groups],
            "name": self.name,
            "user_id": self.user_id,
        }
        if self._id:
            doc["_id"] = self._id
        return doc

    @staticmethod
    def from_bson(d: dict[str, Any]) -> "MapDoc":
        user_id= d["user_id"]
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        return MapDoc(
            up_right_point=Point.from_bson(d["up_right_point"]),
            down_left_point=Point.from_bson(d["down_left_point"]),
            user_id=user_id,
            borders=[Segment.from_bson(s) for s in d.get("borders", [])],
            persons=[NamedPointSpec.from_bson(p) for p in d.get("persons", [])],
            goals=[NamedPointSpec.from_bson(p) for p in d.get("goals", [])],
            groups=[GroupSpec.from_bson(g) for g in d.get("groups", [])],
            name=d.get("name", "Без названия"),
            _id=d.get("_id"),
        )

def transform_to_db_schema(map_doc_bson: dict) -> dict:
    draft = {}
    draft["borders"] = map_doc_bson["borders"]
    draft["persons"] = map_doc_bson["persons"]
    draft["goals"] = map_doc_bson["goals"]
    draft["groups"] = map_doc_bson["groups"]
    draft["counter"] = 1
    del map_doc_bson["borders"]
    del map_doc_bson["persons"]
    del map_doc_bson["goals"]
    del map_doc_bson["groups"]
    map_doc_bson["draft_id"] = 0
    return draft

def transform_from_db_schema(map_bson: dict, draft_bson: dict):
    map_bson["borders"] = draft_bson["borders"]
    map_bson["persons"] = draft_bson["persons"]
    map_bson["goals"] = draft_bson["goals"]
    map_bson["groups"] = draft_bson["groups"]
    del map_bson["draft_id"]

@dataclass
class AnimationBlock:
    borders: List[Segment] = field(default_factory=list)
    persons: List[NamedPointSpec] = field(default_factory=list)
    goals: List[NamedPointSpec] = field(default_factory=list)
    groups: List[GroupSpec] = field(default_factory=list)
    routes: List[Dict] = field(default_factory=list)
    ticks: int = 0

    def to_bson(self) -> dict:
        return {
            "borders": [s.to_bson() for s in self.borders],
            "persons": [p.to_bson() for p in self.persons],
            "goals": [p.to_bson() for p in self.goals],
            "groups": [g.to_bson() for g in self.groups],
            "routes": self.routes,
            "ticks": self.ticks,
        }

    @staticmethod
    def from_bson(d: dict) -> "AnimationBlock":
        return AnimationBlock(
            borders=[Segment.from_bson(s) for s in d.get("borders", [])],
            persons=[NamedPointSpec.from_bson(p) for p in d.get("persons", [])],
            goals=[NamedPointSpec.from_bson(p) for p in d.get("goals", [])],
            groups=[GroupSpec.from_bson(g) for g in d.get("groups", [])],
            routes=d.get("routes", []),
            ticks=int(d["ticks"]),
        )

@dataclass
class AnimationDoc:
    up_right_point: Point
    down_left_point: Point
    user_id: ObjectId
    blocks: List[AnimationBlock] = field(default_factory=list)
    statistics: Dict = field(default_factory=dict)
    name: str = "Без названия"
    _id: Optional[ObjectId] = None

    def set_id(self, oid: ObjectId | None) -> None:
        self._id = oid

    def get_id(self) -> Optional[ObjectId]:
        return self._id

    def to_bson(self) -> Dict[str, Any]:
        doc: Dict[str, Any] = {
            "up_right_point": self.up_right_point.to_bson(),
            "down_left_point": self.down_left_point.to_bson(),
            "blocks": [b.to_bson() for b in self.blocks],
            "statistics": self.statistics,
            "name": self.name,
            "user_id": self.user_id,
        }
        if self._id:
            doc["_id"] = self._id
        return doc

    @staticmethod
    def from_bson(d: dict[str, Any]) -> "AnimationDoc":
        user_id= d["user_id"]
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        return AnimationDoc(
            up_right_point=Point.from_bson(d["up_right_point"]),
            down_left_point=Point.from_bson(d["down_left_point"]),
            user_id=user_id,
            blocks=[AnimationBlock.from_bson(b) for b in d["blocks"]],
            statistics=d.get("statistics", {}),
            name=d.get("name", "Без названия"),
            _id=d.get("_id"),
        )

def transform_animation_to_db_schema(a: dict) -> list[dict]:
    return [transform_to_db_schema(block) for block in a["blocks"]]

def transform_animation_from_db_schema(a: dict, drafts_bsons: list[dict]):
    a["blocks"] = [transform_from_db_schema(block, draft) for (block, draft) in zip(a["blocks"],
                                                                                    drafts_bsons)]

def replace_draft_ids_in_animation(a: dict, drafts_bsons: list[dict]):
    for block, draft in zip(a["blocks"], drafts_bsons):
        block["draft_id"] = draft["_id"]
