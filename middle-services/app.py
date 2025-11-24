from __future__ import annotations

import json
import os
from collections import OrderedDict
from typing import Any, Optional

import requests
from bson import ObjectId
from dotenv import load_dotenv
from flask import Flask, Response, jsonify, request
from flask_cors import CORS

from crowd_db.db.models import AnimationDoc, MapDoc
from crowd_db.db.repository import MongoMapRepository

load_dotenv()

CPP_BACKEND_URL = os.getenv("CPP_BACKEND_URL", "http://localhost:8080/route")

app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False
CORS(app)

repo = MongoMapRepository()

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


@app.route("/maps", methods=["POST"])
def create_map():
    payload = request.get_json(force=True)
    try:
        m = MapDoc.from_bson(payload)
        oid = repo.create(m)
        return jsonify({"_id": str(oid)}), 201
    except Exception as e: # pylint: disable=broad-exception-caught
        return jsonify({"error": f"invalid map payload: {e}"}), 400


@app.route("/maps", methods=["GET"])
def get_maps():
    try:
        maps = repo.list(limit=1000)
        map_list = [
            {
                "id": str(m.get_id()),
                "name": m.name or "Без названия"
            }
            for m in maps
            if m.get_id() is not None
        ]
        return jsonify(map_list), 200
    except Exception as e:
        return jsonify({"error": f"Internal server error: {e}"}), 500

@app.route("/maps/<map_id>", methods=["DELETE"])
def delete_map(map_id: str):
    try:
        ok = repo.delete(map_id)
        if not ok:
            return jsonify({"error": "map not found"}), 400
        return jsonify({"message": "map deleted"}), 200
    except Exception as e: # pylint: disable=broad-exception-caught
        return jsonify({"error": f"delete failed: {e}"}), 400

@app.route("/maps/<map_id>", methods=["GET"])
def get_map(map_id: str):
    m = repo.get(map_id)
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

def calculate_statistics_for_endpoint(endpoint: str,
                payload: str, headers: dict[str, str]) -> tuple[Any, Any]:
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

    return {
        "value": (
            max(x for x in personal_values if x is not None)
            if count_of_none != len(personal_values)
            else None
        ),
        "problematic": count_of_none,
    }, j     # type: ignore


@app.route("/maps/<map_id>/statistics/<algo>", methods=["GET"])
def get_statistics(map_id: str, algo: str):
    if algo not in {"dense", "simple", "random"}:
        return jsonify({"error": "invalid algorithm"}), 400
    m = repo.get(map_id)
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
    except requests.RequestException as e:
        return jsonify({"error": "cpp backend error", "details": str(e)}), 500
    return jsonify({"valid": dense_result, "ideal": simple_result, "routes": route}), 200


@app.route("/maps/<map_id>", methods=["PUT"])
def update_map(map_id: str):
    payload = request.get_json(force=True)
    try:
        m = MapDoc.from_bson(payload)
        m.identifier = ObjectId(map_id)
        ok = repo.replace(m)
        if not ok:
            return jsonify({"error": "map not found"}), 400
        return jsonify({"message": "map updated"}), 200
    except Exception as e: # pylint: disable=broad-exception-caught
        return jsonify({"error": f"invalid map payload: {e}"}), 400


@app.route("/animations", methods=["POST"])
def create_animation():
    payload = request.get_json(force=True)
    try:
        animation_doc = AnimationDoc.from_bson(payload)
        animation_id = repo.create_animation(animation_doc.to_bson())
        return jsonify({"_id": str(animation_id)}), 201
    except Exception as e: # pylint: disable=broad-exception-caught
        return jsonify({"error": f"invalid animation payload: {e}"}), 400

@app.route("/animations", methods=["GET"])
def get_animations():
    try:
        animations = repo.get_animations(limit=1000)
        animation_list = [
            {
                "id": str(anim.get_id()),
                "name": anim.name or "Без названия"
            }
            for anim in animations
            if anim.get_id() is not None
        ]
        return jsonify(animation_list), 200
    except Exception as e:
        return jsonify({"error": f"Internal server error: {e}"}), 500

@app.route("/animations/<animation_id>", methods=["GET"])
def get_animation(animation_id: str):
    try:
        animation = repo.get_animation(animation_id)
        if animation is None:
            return jsonify({"error": "Animation was not found"}), 400
        animation_data = animation.to_bson()

        if '_id' in animation_data and isinstance(animation_data['_id'], ObjectId):
            animation_data['_id'] = str(animation_data['_id'])
        if 'name' not in animation_data:
            animation_data['name'] = animation.name or "Без названия"

        return jsonify(animation_data), 200
    except Exception as e:
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

@app.route("/animations/<animation_id>", methods=["PUT"])
def update_animation(animation_id: str):
    payload = request.get_json(force=True)
    try:
        new_name = payload.get('name', '')
        result = repo.update_animation_name(animation_id, new_name)
        if not result:
            return jsonify({"error": "animation not found"}), 400
        return jsonify({"message": "animation updated"}), 200
    except Exception as e:
        return jsonify({"error": f"invalid animation payload: {e}"}), 400

@app.route("/animations/<animation_id>", methods=["DELETE"])
def delete_animation(animation_id: str):
    try:
        ok = repo.delete_animation(animation_id)
        if not ok:
            return jsonify({"error": "animation not found"}), 400
        return jsonify({"message": "animation deleted"}), 200
    except Exception as e:
        return jsonify({"error": f"delete failed: {e}"}), 400
