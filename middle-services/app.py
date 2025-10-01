from __future__ import annotations
import os
import json
import requests
from bson import ObjectId
from dotenv import load_dotenv
from flask import Flask, jsonify, request, Response
from flask_cors import CORS
from collections import OrderedDict

from crowd_db.db.models import MapDoc
from crowd_db.db.repository import MongoMapRepository
from crowd_db.db.validators import apply_collection_validator

load_dotenv()

CPP_BACKEND_URL = os.getenv("CPP_BACKEND_URL", "http://localhost:8080/route")

app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False
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
    od["up_right_point"] = d["up_right_point"]
    od["down_left_point"] = d["down_left_point"]
    od["borders"] = d.get("borders", [])
    od["persons"] = d.get("persons", [])
    return od


# ------- 1) Сохранить карту -------
@app.route("/maps", methods=["POST"])
def create_map():
    payload = request.get_json(force=True)
    try:
        m = MapDoc.from_bson(payload)
        oid = repo.create(m)
        return jsonify({"_id": str(oid)}), 201
    except Exception as e:
        return jsonify({"error": f"invalid map payload: {e}"}), 400

# ------- 1.5) Выдать список карт -------
@app.route("/maps", methods=["GET"])
def get_maps():
    try:
        index_list = list(map(lambda m: m._id,repo.list(limit=1000)))
        return jsonify(index_list), 200
    except Exception as e:
        return jsonify({"error": f"Internal server error: {e}"}), 500


# ------- 2) Получить карту по id -------
@app.route("/maps/<map_id>", methods=["GET"])
def get_map(map_id: str):
    m = repo.get(map_id)
    if not m:
        return jsonify({"error": "map not found"}), 400

    resp = OrderedDict()
    if m._id is not None:
        resp["_id"] = str(m._id)
    resp["up_right_point"] = m.up_right_point.to_bson()
    resp["down_left_point"] = m.down_left_point.to_bson()
    resp["borders"] = [s.to_bson() for s in m.borders]
    resp["persons"] = [p.to_bson() for p in m.persons]

    return Response(
        json.dumps(resp, ensure_ascii=False, sort_keys=False, indent=2),
        mimetype="application/json"
    )


# ------- 3) Запустить симуляцию -------
@app.route("/maps/<map_id>/simulate", methods=["POST"])
def simulate(map_id: str):
    m = repo.get(map_id)
    if not m:
        return jsonify({"error": "map not found"}), 400

    od = mapdoc_to_json(m)
    payload = json.dumps(od, ensure_ascii=False)
    headers = {"Content-Type": "application/json"}
    try:
        r = requests.post(
            CPP_BACKEND_URL,
            data=payload,
            headers=headers,
            timeout=30,
        )
        r.raise_for_status()
    except requests.RequestException as e:
        return jsonify({"error": "cpp backend error", "details": str(e)}), 500

    return jsonify(r.json()), 200


# ------- 4) Обновить карту по id -------
@app.route("/maps/<map_id>", methods=["PUT"])
def update_map(map_id: str):
    payload = request.get_json(force=True)
    try:
        m = MapDoc.from_bson(payload)
        m._id = ObjectId(map_id)  
        ok = repo.replace(m)
        if not ok:
            return jsonify({"error": "map not found"}), 400
        return jsonify({"message": "map updated"}), 200
    except Exception as e:
        return jsonify({"error": f"invalid map payload: {e}"}), 400

if __name__ == "__main__":
    apply_collection_validator()
    app.run(host="0.0.0.0", port=5000, debug=True)

