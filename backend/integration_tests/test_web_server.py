import requests

URL_POST = "http://localhost:8080/route"

def test_simple_route_good():
    data = '''
{
    "_id": "0",
    "up_right_point": { "x": 100, "y": 100 },
    "down_left_point": { "x": 0, "y": 0 },
    "borders": [
        { "first": { "x": 0, "y": 0 }, "second": { "x": 10, "y": 0 } },
        { "first": { "x": 10, "y": 0 }, "second": { "x": 10, "y": 10 } },
        { "first": { "x": 0, "y": 10 }, "second": { "x": 10, "y": 10 } },
        { "first": { "x": 0, "y": 0 }, "second": { "x": 0, "y": 10 } }
    ],
    "persons": [
        {
            "id": 0,
            "position": { "x": 1, "y": 1 },
            "goal": { "x": 1, "y": 2 }
        }
    ]
}
    '''
    result = '''[{"id":0,"route":["UP"]}]'''
    response = requests.post(url=URL_POST, data=data, timeout=10)
    assert response.status_code == 200
    assert response.text == result

def test_no_type_error():
    data = '''
{
    "_id": 0,
    "up_right_point": { "x": 100, "y": 100 },
    "down_left_point": { "x": 0, "y": 0 },
    "borders": [
        { "first": { "x": 0, "y": 0 }, "second": { "x": 10, "y": 0 } },
        { "first": { "x": 10, "y": 0 }, "second": { "x": 10, "y": 10 } },
        { "first": { "x": 0, "y": 10 }, "second": { "x": 10, "y": 10 } },
        { "first": { "x": 0, "y": 0 }, "second": { "x": 0, "y": 10 } }
    ],
    "persons": [
        {
            "id": 0,
            "position": { "x": 1, "y": 1 },
            "goal": { "x": 1, "y": 2 }
        }
    ]
}
    '''
    response = requests.post(url=URL_POST, data=data, timeout=10)
    assert response.status_code == 400

def test_no_route_good():
    data = '''
{
    "_id": "0",
    "up_right_point": { "x": 100, "y": 100 },
    "down_left_point": { "x": 0, "y": 0 },
    "borders": [
        { "first": { "x": 0, "y": 0 }, "second": { "x": 10, "y": 0 } },
        { "first": { "x": 10, "y": 0 }, "second": { "x": 10, "y": 10 } },
        { "first": { "x": 0, "y": 10 }, "second": { "x": 10, "y": 10 } },
        { "first": { "x": 0, "y": 0 }, "second": { "x": 0, "y": 10 } }
    ],
    "persons": [
        {
            "id": 0,
            "position": { "x": 0, "y": 1 },
            "goal": { "x": 0, "y": 1 }
        }
    ]
}
    '''
    result = '''[{"id":0,"route":[]}]'''
    response = requests.post(url=URL_POST, data=data, timeout=10)
    assert response.status_code == 200
    assert response.text == result

def test_cant_reach_good():
    data = '''
{
    "_id": "0",
    "up_right_point": { "x": 100, "y": 100 },
    "down_left_point": { "x": 0, "y": 0 },
    "borders": [
        { "first": { "x": 0, "y": 0 }, "second": { "x": 10, "y": 0 } },
        { "first": { "x": 10, "y": 0 }, "second": { "x": 10, "y": 10 } },
        { "first": { "x": 0, "y": 10 }, "second": { "x": 10, "y": 10 } },
        { "first": { "x": 0, "y": 0 }, "second": { "x": 0, "y": 10 } }
    ],
    "persons": [
        {
            "id": 0,
            "position": { "x": 0, "y": 1 },
            "goal": { "x": 0, "y": 100 }
        }
    ]
}
    '''
    result = '''[{"id":0,"route":null}]'''
    response = requests.post(url=URL_POST, data=data, timeout=10)
    assert response.status_code == 200
    assert response.text == result

def test_missed_json_field_bad():
    data = '''
{
    "_id": "0",
    "up_right_point": { "x": 100, "y": 100 },
    "down_left_point": { "x": 0, "y": 0 },
    "borders": [
        { "first": { "x": 0, "y": 0 }, "second": { "x": 10, "y": 0 } },
        { "first": { "x": 10, "y": 0 }, "second": { "x": 10, "y": 10 } },
        { "first": { "x": 0, "y": 10 }, "second": { "x": 10, "y": 10 } },
        { "first": { "x": 0, "y": 0 }, "second": { "x": 0, "y": 10 } }
    ],
    "persons": [
        {
            "id": 0,
            "goal": { "x": 0, "y": 100 }
        }
    ]
}
    '''
    response = requests.post(url=URL_POST, data=data, timeout=10)
    assert response.status_code == 400

def test_invalid_json_bad():
    data = '''
...///$$$RRR
    '''
    response = requests.post(url=URL_POST, data=data, timeout=10)
    assert response.status_code == 400

def test_complicated_route_good():
    data = '''
{
    "_id": "0",
    "up_right_point": { "x": 100, "y": 100 },
    "down_left_point": { "x": 0, "y": 0 },
    "borders": [
        { "first": { "x": 0, "y": 0 }, "second": { "x": 10, "y": 0 } },
        { "first": { "x": 10, "y": 0 }, "second": { "x": 10, "y": 10 } },
        { "first": { "x": 0, "y": 10 }, "second": { "x": 10, "y": 10 } },
        { "first": { "x": 0, "y": 0 }, "second": { "x": 0, "y": 10 } }
    ],
    "persons": [
        {
            "id": 0,
            "position": { "x": 1, "y": 1 },
            "goal": { "x": 1, "y": 6 }
        },
        {
            "id": 1,
            "position": { "x": 1, "y": 1 },
            "goal": { "x": 2, "y": 1 }
        }
    ]
}
    '''
    result = '''[{"id":0,"route":["UP","UP","UP","UP","UP"]},{"id":1,"route":["RIGHT"]}]'''
    response = requests.post(url=URL_POST, data=data, timeout=10)
    assert response.status_code == 200
    assert response.text == result
