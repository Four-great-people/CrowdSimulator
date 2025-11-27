from __future__ import annotations

import json
import os
from collections import OrderedDict
from typing import Any, Optional

import requests
from bson import ObjectId
from bson.errors import InvalidId
from dotenv import load_dotenv
from flask import Flask, Response, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt_identity,
    jwt_required,
)

from crowd_db.db.models import (
    AnimationBlock, AnimationDoc, MapDoc, UserDoc, Point, Segment, NamedPointSpec, GroupSpec
)
from crowd_db.db.repository import MongoMapRepository, MongoUserRepository

load_dotenv()

CPP_BACKEND_URL = os.getenv("CPP_BACKEND_URL", "http://localhost:8080/route")

app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "CHANGE_ME_IN_PRODUCTION")
CORS(app)

jwt = JWTManager(app)

repo = MongoMapRepository()
user_repo = MongoUserRepository()


def _current_user_oid() -> Optional[ObjectId]:
    """Преобразуем identity из JWT в ObjectId, аккуратно."""
    identity = get_jwt_identity()
    if identity is None:
        return None
    try:
        return ObjectId(identity)
    except (InvalidId, TypeError):
        return None


def mapdoc_to_json(m: MapDoc) -> OrderedDict:
    d = m.to_bson()
    _id = d.get("_id")
    if isinstance(_id, ObjectId):
        _id = str(_id)

    od = OrderedDict()
    if _id is not None:
        od["_id"] = _id
    od["name"] = m.name or "Без названия"
    od["up_right_point"] = d["up_right_point"]
    od["down_left_point"] = d["down_left_point"]
    od["borders"] = d.get("borders", [])
    od["persons"] = d.get("persons", [])
    od["goals"] = d.get("goals", [])
    od["groups"] = d.get("groups", [])
    return od

def block_request_to_json(b: dict, up_right_point: dict, down_left_point: dict) -> OrderedDict:
    od = OrderedDict()
    od["_id"] = ""
    od["name"] = ""
    od["up_right_point"] = up_right_point
    od["down_left_point"] = down_left_point
    od["borders"] = b.get("borders", [])
    od["persons"] = b.get("persons", [])
    od["goals"] = b.get("goals", [])
    od["groups"] = b.get("groups", [])
    return od


# ---------- Аутентификация ----------


@app.route("/auth/register", methods=["POST"])
def register():
    """
    Регистрация пользователя.
    Тело: { "username": "...", "password": "..." }
    Ответ: { "access_token": "..." }
    """
    data = request.get_json(force=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username or not password:
        return jsonify({"error": "username and password are required"}), 400

    if user_repo.get_by_username(username) is not None:
        return jsonify({"error": "user already exists"}), 400

    user = UserDoc(username=username, password_hash="")
    user.set_password(password)
    user_id = user_repo.create(user)
    access_token = create_access_token(identity=str(user_id))
    return jsonify({"access_token": access_token}), 201


@app.route("/auth/login", methods=["POST"])
def login():
    """
    Логин.
    Тело: { "username": "...", "password": "..." }
    Ответ: { "access_token": "..." }
    """
    data = request.get_json(force=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username or not password:
        return jsonify({"error": "username and password are required"}), 400

    user = user_repo.get_by_username(username)
    if user is None or not user.check_password(password):
        return jsonify({"error": "invalid username or password"}), 401

    user_id = user.get_id()
    if user_id is None:
        return jsonify({"error": "internal user id error"}), 500

    access_token = create_access_token(identity=str(user_id))
    return jsonify({"access_token": access_token}), 200


# ---------- Карты ----------


@app.route("/maps", methods=["POST"])
@jwt_required()
def create_map():
    payload = request.get_json(force=True)
    try:
        user_oid = _current_user_oid()
        if user_oid is None:
            return jsonify({"error": "invalid user identity"}), 401

        m = MapDoc(
            up_right_point=Point.from_bson(payload["up_right_point"]),
            down_left_point=Point.from_bson(payload["down_left_point"]),
            user_id=user_oid,
            borders=[Segment.from_bson(s) for s in payload.get("borders", [])],
            persons=[NamedPointSpec.from_bson(p) for p in payload.get("persons", [])],
            goals=[NamedPointSpec.from_bson(g) for g in payload.get("goals", [])],
            groups=[GroupSpec.from_bson(g) for g in payload.get("groups", [])],
            name=payload.get("name", "Без названия"),
        )
        oid = repo.create(m)
        return jsonify({"_id": str(oid)}), 201
    except Exception as e:
        return jsonify({"error": f"invalid map payload: {e}"}), 400

@app.route("/maps", methods=["GET"])
@jwt_required()
def get_maps():
    try:
        user_oid = _current_user_oid()
        if user_oid is None:
            return jsonify({"error": "invalid user identity"}), 401
        maps = repo.list_for_user(user_oid, limit=1000)
        map_list = [
            {
                "id": str(m.get_id()),
                "name": m.name or "Без названия",
            }
            for m in maps
            if m.get_id() is not None
        ]
        return jsonify(map_list), 200
    except Exception as e:
        return jsonify({"error": f"Internal server error: {e}"}), 500


@app.route("/maps/<map_id>", methods=["DELETE"])
@jwt_required()
def delete_map(map_id: str):
    try:
        user_oid = _current_user_oid()
        if user_oid is None:
            return jsonify({"error": "invalid user identity"}), 401
        ok = repo.delete_for_user(map_id, user_oid)
        if not ok:
            return jsonify({"error": "map not found"}), 400
        return jsonify({"message": "map deleted"}), 200
    except Exception as e:
        return jsonify({"error": f"delete failed: {e}"}), 400


@app.route("/maps/<map_id>", methods=["GET"])
@jwt_required()
def get_map(map_id: str):
    user_oid = _current_user_oid()
    if user_oid is None:
        return jsonify({"error": "invalid user identity"}), 401

    m = repo.get_for_user(map_id, user_oid)
    if not m:
        return jsonify({"error": "map not found"}), 400

    resp = OrderedDict()
    if m.get_id() is not None:
        resp["_id"] = str(m.get_id())
    resp["name"] = m.name or "Без названия"
    resp["up_right_point"] = m.up_right_point.to_bson()
    resp["down_left_point"] = m.down_left_point.to_bson()
    resp["borders"] = [s.to_bson() for s in m.borders]
    resp["persons"] = [p.to_bson() for p in m.persons]
    resp["goals"] = [p.to_bson() for p in m.goals]
    resp["groups"] = [g.to_bson() for g in m.groups]

    return Response(
        json.dumps(resp, ensure_ascii=False, sort_keys=False, indent=2),
        mimetype="application/json",
    )


def calculate_statistics_for_endpoint(
    endpoint: str, payload: str, headers: dict[str, str]
) -> tuple[Any, Any]:
    result = requests.post(
        f"{CPP_BACKEND_URL}/{endpoint}",
        data=payload,
        headers=headers,
        timeout=30,
    )
    result.raise_for_status()
    j = result.json()

    def extract_person(person) -> Optional[int]:
        route = person.get("route")
        if not route:
            return None
        return sum(15 if "_" in direction else 10 for direction in route)

    personal_values = list(map(extract_person, j))
    count_of_none = len([x for x in personal_values if x is None])

    return (
        {
            "value": (
                max(x for x in personal_values if x is not None)
                if count_of_none != len(personal_values)
                else None
            ),
            "problematic": count_of_none,
        },
        j,
    )  # type: ignore


@app.route("/maps/<map_id>/statistics/<algo>", methods=["GET"])
@jwt_required()
def get_statistics(map_id: str, algo: str):
    if algo not in {"dense", "simple", "random"}:
        return jsonify({"error": "invalid algorithm"}), 400

    user_oid = _current_user_oid()
    if user_oid is None:
        return jsonify({"error": "invalid user identity"}), 401

    m = repo.get_for_user(map_id, user_oid)
    if not m:
        return jsonify({"error": "map not found"}), 400

    od = mapdoc_to_json(m)
    payload = json.dumps(od, ensure_ascii=False)
    headers = {"Content-Type": "application/json"}
    try:
        dense_result, route = calculate_statistics_for_endpoint(algo, payload, headers)
        if algo != "simple":
            simple_result, _ = calculate_statistics_for_endpoint("simple", payload, headers)
        else:
            simple_result = dense_result
    except requests.RequestException as e:  # pragma: no cover
        return jsonify({"error": "cpp backend error", "details": str(e)}), 500
    return jsonify({"valid": dense_result, "ideal": simple_result, "routes": route}), 200

@app.route("/maps/<map_id>", methods=["PUT"])
@jwt_required()
def update_map(map_id: str):
    payload = request.get_json(force=True)
    try:
        user_oid = _current_user_oid()
        if user_oid is None:
            return jsonify({"error": "invalid user identity"}), 401

        m = MapDoc(
            up_right_point=Point.from_bson(payload["up_right_point"]),
            down_left_point=Point.from_bson(payload["down_left_point"]),
            user_id=user_oid,
            borders=[Segment.from_bson(s) for s in payload.get("borders", [])],
            persons=[NamedPointSpec.from_bson(p) for p in payload.get("persons", [])],
            goals=[NamedPointSpec.from_bson(g) for g in payload.get("goals", [])],
            groups=[GroupSpec.from_bson(g) for g in payload.get("groups", [])],
            name=payload.get("name", "Без названия"),
        )
        m.set_id(ObjectId(map_id))

        ok = repo.replace_for_user(m, user_oid)
        if not ok:
            return jsonify({"error": "map not found"}), 400
        return jsonify({"message": "map updated"}), 200
    except Exception as e:
        return jsonify({"error": f"invalid map payload: {e}"}), 400


# ---------- Анимации ----------


@app.route("/animations", methods=["POST"])
@jwt_required()
def create_animation():
    payload = request.get_json(force=True)
    try:
        user_oid = _current_user_oid()
        if user_oid is None:
            return jsonify({"error": "invalid user identity"}), 401
        payload["user_id"] = user_oid
        animation_doc = AnimationDoc.from_bson(payload)
        animation_id = repo.create_animation(animation_doc.to_bson())
        return jsonify({"_id": str(animation_id)}), 201
    except Exception as e:
        return jsonify({"error": f"invalid animation payload: {e}"}), 400


@app.route("/animations", methods=["GET"])
@jwt_required()
def get_animations():
    try:
        user_oid = _current_user_oid()
        if user_oid is None:
            return jsonify({"error": "invalid user identity"}), 401

        animations = repo.get_animations_for_user(user_oid, limit=1000)
        animation_list = [
            {
                "id": str(anim.get_id()),
                "name": anim.name or "Без названия",
            }
            for anim in animations
            if anim.get_id() is not None
        ]
        return jsonify(animation_list), 200
    except Exception as e:
        return jsonify({"error": f"Internal server error: {e}"}), 500


@app.route("/animations/<animation_id>", methods=["POST"])
@jwt_required()
def clone_animation(animation_id: str):
    try:
        user_oid = _current_user_oid()
        if user_oid is None:
            return jsonify({"error": "invalid user identity"}), 401
        animation = repo.get_animation_for_user(animation_id, user_oid)
        if animation is None:
            return jsonify({"error": "Animation was not found"}), 400
        new_animation_id = repo.create_animation(animation.to_bson())
        return jsonify({"_id": str(new_animation_id)}), 201
    except Exception as e:
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

@app.route("/animations/<animation_id>", methods=["GET"])
@jwt_required()
def get_animation(animation_id: str):
    try:
        user_oid = _current_user_oid()
        if user_oid is None:
            return jsonify({"error": "invalid user identity"}), 401
        animation = repo.get_animation_for_user(animation_id, user_oid)
        if animation is None:
            return jsonify({"error": "Animation was not found"}), 400
        resp = OrderedDict()
        if animation.get_id() is not None:
            resp["_id"] = str(animation.get_id())
        resp["name"] = animation.name or "Без названия"
        resp["up_right_point"] = animation.up_right_point.to_bson()
        resp["down_left_point"] = animation.down_left_point.to_bson()
        resp["blocks"] = [b.to_bson() for b in animation.blocks]
        resp["statistics"] = animation.statistics
        return jsonify(resp), 200
    except Exception as e:
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500


@app.route("/animations/<animation_id>/statistics/<algo>", methods=["GET"])
@jwt_required()
def get_saved_animation_statistics(animation_id: str, algo: str):
    if algo not in {"dense", "simple", "random"}:
        return jsonify({"error": "invalid algorithm"}), 400
    user_oid = _current_user_oid()
    if user_oid is None:
        return jsonify({"error": "invalid user identity"}), 401
    try:
        payload = request.get_json(force=True)
        ticks = int(payload["ticks"])
        algo_data = block_request_to_json(payload["block"], payload["up_right_point"], payload["down_left_point"])
        algo_payload = json.dumps(algo_data, ensure_ascii=False)
        headers = {"Content-Type": "application/json"}
    except Exception as e:
        return jsonify({"error": f"wrong payload {e}"}), 400
    try:
        dense_result, route = calculate_statistics_for_endpoint(algo, algo_payload, headers)
        if algo != "simple":
            simple_result, _ = calculate_statistics_for_endpoint("simple", algo_payload, headers)
        else:
            simple_result = dense_result
    except requests.RequestException as e:  # pragma: no cover
        return jsonify({"error": "cpp backend error", "details": str(e)}), 500
    new_statistics = {"valid": dense_result, "ideal": simple_result, "routes": route}
    a = repo.get_animation_for_user(animation_id, user_oid)
    if not a:
        return jsonify({"error": "map not found"}), 400
    try:
        a.blocks[-1].ticks = ticks
        payload["block"]["routes"] = route
        block = AnimationBlock.from_bson(payload["block"])
        a.blocks.append(block)
        bls = [b.to_bson() for b in a.blocks]
        if not repo.update_animation_for_user(animation_id, user_oid, bls, new_statistics):
            return jsonify({"error": f"map was already deleted"}), 400
    except Exception as e:
        return jsonify({"error": f"error wrong payload {e}"}), 400
    return jsonify(new_statistics), 200

@app.route("/animations/statistics/<algo>", methods=["POST"])
@jwt_required()
def get_unsaved_animation_statistics(algo: str):
    if algo not in {"dense", "simple", "random"}:
        return jsonify({"error": "invalid algorithm"}), 400
    user_oid = _current_user_oid()
    if user_oid is None:
        return jsonify({"error": "invalid user identity"}), 401
    try:
        payload = request.get_json(force=True)
        algo_data = block_request_to_json(payload["block"], payload["up_right_point"], payload["down_left_point"])
        algo_payload = json.dumps(algo_data, ensure_ascii=False)
        headers = {"Content-Type": "application/json"}
    except Exception as e:
        return jsonify({"error": f"wrong payload {e}"}), 400
    try:
        dense_result, route = calculate_statistics_for_endpoint(algo, algo_payload, headers)
        if algo != "simple":
            simple_result, _ = calculate_statistics_for_endpoint("simple", algo_payload, headers)
        else:
            simple_result = dense_result
    except requests.RequestException as e:  # pragma: no cover
        return jsonify({"error": "cpp backend error", "details": str(e)}), 500
    new_statistics = {"valid": dense_result, "ideal": simple_result, "routes": route}
    return jsonify(new_statistics), 200

@app.route("/animations/<animation_id>", methods=["PUT"])
@jwt_required()
def update_animation_name(animation_id: str):
    payload = request.get_json(force=True)
    try:
        user_oid = _current_user_oid()
        if user_oid is None:
            return jsonify({"error": "invalid user identity"}), 401

        new_name = payload.get("name", "")
        result = repo.update_animation_name_for_user(animation_id, user_oid, new_name)
        if not result:
            return jsonify({"error": "animation not found"}), 400
        return jsonify({"message": "animation updated"}), 200
    except Exception as e:
        return jsonify({"error": f"invalid animation payload: {e}"}), 400


@app.route("/animations/<animation_id>", methods=["DELETE"])
@jwt_required()
def delete_animation(animation_id: str):
    try:
        user_oid = _current_user_oid()
        if user_oid is None:
            return jsonify({"error": "invalid user identity"}), 401

        ok = repo.delete_animation_for_user(animation_id, user_oid)
        if not ok:
            return jsonify({"error": "animation not found"}), 400
        return jsonify({"message": "animation deleted"}), 200
    except Exception as e:
        return jsonify({"error": f"delete failed: {e}"}), 400
