
from __future__ import annotations
import json
from bson import ObjectId

def valid_payload():
    return {
        "up_right_point": {"x": 10, "y": 10},
        "down_left_point": {"x": 0, "y": 0},
        "borders": [
            {"first": {"x": 0, "y": 0}, "second": {"x": 10, "y": 0}},
            {"first": {"x": 10, "y": 0}, "second": {"x": 10, "y": 10}},
        ],
        "persons": [
            {"id": 1, "position": {"x": 1, "y": 1}, "goal": {"x": 5, "y": 5}},
            {"id": 2, "position": {"x": 2, "y": 2}, "goal": {"x": 6, "y": 6}},
        ],
    }

def test_create_map_returns_id(client):
    resp = client.post("/maps", json=valid_payload())
    assert resp.status_code == 201
    data = resp.get_json()
    assert "_id" in data
   
    assert len(data["_id"]) == 24

def test_get_map_returns_full_document_in_order(client):
   
    resp = client.post("/maps", json=valid_payload())
    oid = resp.get_json()["_id"]

  
    resp2 = client.get(f"/maps/{oid}")
    assert resp2.status_code == 200

    
    raw = resp2.get_data(as_text=True).replace(" ", "")
  
    assert raw.find('"__id"') == -1  
    i_id = raw.find('"_id"')
    i_up = raw.find('"up_right_point"')
    i_down = raw.find('"down_left_point"')
    i_borders = raw.find('"borders"')
    i_persons = raw.find('"persons"')
    assert 0 <= i_id < i_up < i_down < i_borders < i_persons

def test_get_map_400(client):
    resp = client.get("/maps/66aaaaaaaaaaaaaaaaaaaaaa")  
    assert resp.status_code == 400

def test_simulate_calls_cpp_with_ordered_payload_and_returns_routes(client, mock_requests):
    
    resp = client.post("/maps", json=valid_payload())
    oid = resp.get_json()["_id"]

 
    resp2 = client.post(f"/maps/{oid}/simulate")
    assert resp2.status_code == 200
    routes = resp2.get_json()
    assert routes == [{"id": 1, "route": ["UP", "RIGHT"]}]

   
    assert len(mock_requests["calls"]) == 1
    call = mock_requests["calls"][0]

   
    body = call["body_text"]
    assert body is not None
    
    packed = body.replace(" ", "").replace("\n", "")

    i_id = packed.find('"_id"')
    i_up = packed.find('"up_right_point"')
    i_down = packed.find('"down_left_point"')
    i_borders = packed.find('"borders"')
    i_persons = packed.find('"persons"')

    assert 0 <= i_id < i_up < i_down < i_borders < i_persons, packed

def test_create_map_bad_payload_400(client):
    bad = {"persons": []}  
    resp = client.post("/maps", json=bad)
    assert resp.status_code == 400

