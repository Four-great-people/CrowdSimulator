from __future__ import annotations

def valid_payload():
    return {
        "name": "Тестовая карта",
        "up_right_point": {"x": 10, "y": 10},
        "down_left_point": {"x": 0, "y": 0},
        "borders": [
            {"first": {"x": 0, "y": 0}, "second": {"x": 10, "y": 0}},
            {"first": {"x": 10, "y": 0}, "second": {"x": 10, "y": 10}},
        ],
        "persons": [
            {"id": 1, "position": {"x": 1, "y": 1}},
            {"id": 2, "position": {"x": 2, "y": 2}},
        ],
        "goals": [
            {"id": 1, "position": {"x": 5, "y": 5}},
            {"id": 2, "position": {"x": 6, "y": 6}},
        ],
        "groups": [
            {
                "id": 0,
                "start_position": {"x": 3, "y": 3},
                "total_count": 3,
                "person_ids": [10, 11, 12]
            },
            {
                "id": 1,
                "start_position": {"x": 4, "y": 4},
                "total_count": 2,
                "person_ids": [20, 21]
            }
        ]
    }


def test_create_map_returns_id(client, auth_headers):
    resp = client.post("/maps", json=valid_payload(), headers=auth_headers)
    assert resp.status_code == 201
    data = resp.get_json()
    assert "_id" in data
    assert len(data["_id"]) == 24


def test_get_maps(client, auth_headers):
    resp = client.post("/maps", json=valid_payload(), headers=auth_headers)
    oid = resp.get_json()["_id"]

    resp2 = client.get("/maps", headers=auth_headers)
    assert resp2.status_code == 200

    json_list = resp2.get_json()
    assert isinstance(json_list, list)

    found = any(item["id"] == oid for item in json_list)
    assert found, f"Map with id {oid} not found in {json_list}"


def test_get_map_returns_full_document_in_order(client, auth_headers):
    resp = client.post("/maps", json=valid_payload(), headers=auth_headers)
    oid = resp.get_json()["_id"]

    resp2 = client.get(f"/maps/{oid}", headers=auth_headers)
    assert resp2.status_code == 200

    raw = resp2.get_data(as_text=True).replace(" ", "")
    assert raw.find('"__id"') == -1
    i_id = raw.find('"_id"')
    i_name = raw.find('"name"')
    i_up = raw.find('"up_right_point"')
    i_down = raw.find('"down_left_point"')
    i_borders = raw.find('"borders"')
    i_persons = raw.find('"persons"')
    i_goals = raw.find('"goals"')
    i_groups = raw.find('"groups"')
    assert 0 <= i_id < i_name < i_up < i_down < i_borders < i_persons < i_goals < i_groups


def test_get_map_400(client, auth_headers):
    resp = client.get("/maps/66aaaaaaaaaaaaaaaaaaaaaa", headers=auth_headers)
    assert resp.status_code == 400

def test_simulate_calls_cpp_unsaved_animation_with_returns_routes(
    client, auth_headers, mock_requests
):
    resp = client.post("/animations/statistics/dense", headers=auth_headers, json={
        "up_right_point": {"x": 10, "y": 10},
        "down_left_point": {"x": 0, "y": 0},
        "block": {
            "borders": [
                {"first": {"x": 0, "y": 0}, "second": {"x": 10, "y": 0}},
                {"first": {"x": 10, "y": 0}, "second": {"x": 10, "y": 10}},
            ],
            "persons": [
                {"id": 1, "position": {"x": 1, "y": 1}},
                {"id": 2, "position": {"x": 2, "y": 2}},
            ],
            "goals": [
                {"id": 1, "position": {"x": 5, "y": 5}},
                {"id": 2, "position": {"x": 6, "y": 6}},
            ],
            "groups": [
                {
                    "id": 0,
                    "start_position": {"x": 3, "y": 3},
                    "total_count": 3,
                    "person_ids": [10, 11, 12]
                },
                {
                    "id": 1,
                    "start_position": {"x": 4, "y": 4},
                    "total_count": 2,
                    "person_ids": [20, 21]
                }
            ]
        }
    })
    assert resp.status_code == 200
    statistics_resp = resp.get_json()
    assert statistics_resp == {
        "ideal": {"value": 35, "problematic": 0},
        "valid": {"value": None, "problematic": 1},
        "routes": [{"id": 1, "route": None}],
    }

    assert len(mock_requests["calls"]) == 2

SAMPLE_ANIMATION = {
        "name": "Моя анимация",
        "up_right_point": {"x": 10, "y": 10},
        "down_left_point": {"x": 0, "y": 0},
        "blocks": [{
            "borders": [
                {"first": {"x": 0, "y": 0}, "second": {"x": 10, "y": 0}},
                {"first": {"x": 10, "y": 0}, "second": {"x": 10, "y": 10}},
            ],
            "persons": [
                {"id": 1, "position": {"x": 1, "y": 1}},
                {"id": 2, "position": {"x": 2, "y": 2}},
            ],
            "goals": [
                {"id": 1, "position": {"x": 5, "y": 5}},
                {"id": 2, "position": {"x": 6, "y": 6}},
            ],
            "groups": [
                {
                    "id": 0,
                    "start_position": {"x": 3, "y": 3},
                    "total_count": 3,
                    "person_ids": [10, 11, 12]
                },
                {
                    "id": 1,
                    "start_position": {"x": 4, "y": 4},
                    "total_count": 2,
                    "person_ids": [20, 21]
                }
            ],
            "routes": [{"id": 1, "route": None}],
            "ticks": -1,
        }],
        "statistics": {
            "ideal": {"value": 35, "problematic": 0},
            "valid": {"value": None, "problematic": 1},
        }
    }

def test_create_animation(client, auth_headers):
    resp = client.post("/animations/map/1", headers=auth_headers, json=SAMPLE_ANIMATION)
    assert resp.status_code == 201
    id_resp = resp.get_json()
    assert "_id" in id_resp

def test_get_animation(client, auth_headers):
    resp = client.post("/animations/map/1", headers=auth_headers, json=SAMPLE_ANIMATION)
    assert resp.status_code == 201
    id_resp = resp.get_json()
    anim_id = id_resp["_id"]
    get_resp = client.get(f"/animations/{anim_id}", headers=auth_headers)
    assert get_resp.status_code == 200

def test_clone_animation(client, auth_headers):
    resp = client.post("/animations/map/1", headers=auth_headers, json=SAMPLE_ANIMATION)
    assert resp.status_code == 201
    id_resp = resp.get_json()
    anim_id = id_resp["_id"]
    clone_resp = client.post(f"/animations/{anim_id}", headers=auth_headers)
    assert clone_resp.status_code == 201
    anim_id2 = clone_resp.get_json()["_id"]
    assert anim_id != anim_id2


def test_simulate_calls_cpp_saved_animation_with_none_and_returns_routes(
    client, auth_headers, mock_requests
):
    resp = client.post("/animations/map/1", headers=auth_headers, json=SAMPLE_ANIMATION)
    assert resp.status_code == 201
    id_resp = resp.get_json()
    anim_id = id_resp["_id"]
    resp = client.get(f"/animations/{anim_id}/statistics/dense", headers=auth_headers, json={
        "block": {
            "borders": [
                {"first": {"x": 0, "y": 0}, "second": {"x": 10, "y": 0}},
                {"first": {"x": 10, "y": 0}, "second": {"x": 10, "y": 10}},
            ],
            "persons": [
                {"id": 1, "position": {"x": 1, "y": 1}},
                {"id": 2, "position": {"x": 2, "y": 2}},
            ],
            "goals": [
                {"id": 1, "position": {"x": 5, "y": 5}},
                {"id": 2, "position": {"x": 6, "y": 6}},
            ],
            "groups": [
                {
                    "id": 0,
                    "start_position": {"x": 3, "y": 3},
                    "total_count": 3,
                    "person_ids": [10, 11, 12]
                },
                {
                    "id": 1,
                    "start_position": {"x": 4, "y": 4},
                    "total_count": 2,
                    "person_ids": [20, 21]
                }
            ]
        },
        "ticks": 10,
    })
    assert resp.status_code == 200
    statistics_resp = resp.get_json()
    assert statistics_resp == {
        "ideal": {"value": 70, "problematic": 0},
        "valid": {"value": None, "problematic": 1},
        "routes": [{"id": 1, "route": None}],
    }
    assert len(mock_requests["calls"]) == 2
    get_resp = client.get(f"/animations/{anim_id}", headers=auth_headers)
    assert get_resp.status_code == 200
    get_resp = get_resp.get_json()
    assert len(get_resp["blocks"]) == len(SAMPLE_ANIMATION["blocks"]) + 1
    assert get_resp["blocks"][-2]["ticks"] == 10
    assert get_resp["blocks"][-1]["ticks"] == -1
    assert get_resp["statistics"]["ideal"]["value"] == 70
    assert get_resp["statistics"]["ideal"]["problematic"] == 0
    assert get_resp["statistics"]["valid"]["value"] is None
    assert get_resp["statistics"]["valid"]["problematic"] == 1


def test_simulate_calls_cpp_with_ordered_payload_and_returns_routes(
    client, auth_headers, mock_requests
):
    resp = client.post("/maps", json=valid_payload(), headers=auth_headers)
    oid = resp.get_json()["_id"]

    resp2 = client.get(f"/maps/{oid}/statistics/dense", headers=auth_headers)
    assert resp2.status_code == 200
    statistics_resp = resp2.get_json()
    assert statistics_resp == {
        "ideal": {"value": 35, "problematic": 0},
        "valid": {"value": None, "problematic": 1},
        "routes": [{"id": 1, "route": None}],
    }

    assert len(mock_requests["calls"]) == 2
    call = mock_requests["calls"][0]

    body = call["body_text"]
    assert body is not None

    packed = body.replace(" ", "").replace("\n", "")

    i_id = packed.find('"_id"')
    i_name = packed.find('"name"')
    i_up = packed.find('"up_right_point"')
    i_down = packed.find('"down_left_point"')
    i_borders = packed.find('"borders"')
    i_persons = packed.find('"persons"')
    i_goals = packed.find('"goals"')
    i_groups = packed.find('"groups"')

    assert 0 <= i_id < i_name < i_up < i_down < i_borders < i_persons < i_goals < i_groups, packed


def test_simulate_calls_cpp_with_statistics(client, auth_headers, mock_requests):
    resp = client.post("/maps", json=valid_payload(), headers=auth_headers)
    oid = resp.get_json()["_id"]

    resp2 = client.get(f"/maps/{oid}/statistics/dense", headers=auth_headers)
    assert resp2.status_code == 200
    statistics = resp2.get_json()
    assert statistics == {
        "ideal": {"value": 35, "problematic": 0},
        "valid": {"value": None, "problematic": 1},
        "routes": [{"id": 1, "route": None}],
    }

    assert len(mock_requests["calls"]) == 2


def test_simulate_calls_cpp_with_statistics_and_simple_routes(
    client, auth_headers, mock_requests
):
    resp = client.post("/maps", json=valid_payload(), headers=auth_headers)
    oid = resp.get_json()["_id"]

    resp2 = client.get(f"/maps/{oid}/statistics/simple", headers=auth_headers)
    assert resp2.status_code == 200
    statistics = resp2.get_json()
    assert statistics == {
        "ideal": {"value": 35, "problematic": 0},
        "valid": {"value": 35, "problematic": 0},
        "routes": [{"id": 1, "route": ["UP", "RIGHT", "LEFT_DOWN"]}],
    }

    assert len(mock_requests["calls"]) == 1


def test_simulate_calls_cpp_with_statistics_and_random_routes(
    client, auth_headers, mock_requests
):
    resp = client.post("/maps", json=valid_payload(), headers=auth_headers)
    oid = resp.get_json()["_id"]

    resp2 = client.get(f"/maps/{oid}/statistics/random", headers=auth_headers)
    assert resp2.status_code == 200
    statistics = resp2.get_json()
    assert statistics == {
        "ideal": {"value": 35, "problematic": 0},
        "valid": {"value": 20, "problematic": 0},
        "routes": [{"id": 1, "route": ["UP", "RIGHT"]}],
    }
    assert len(mock_requests["calls"]) == 2


def test_create_map_bad_payload_400(client, auth_headers):
    bad = {"persons": []}
    resp = client.post("/maps", json=bad, headers=auth_headers)
    assert resp.status_code == 400
