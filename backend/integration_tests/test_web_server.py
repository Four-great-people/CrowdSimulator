import pytest
import requests

URL_POST_SIMPLE = "http://localhost:8080/route/simple"
URL_POST_DENSE = "http://localhost:8080/route/dense"
URL_POST_RANDOM = "http://localhost:8080/route/dense"

URL_POSTS = [URL_POST_DENSE, URL_POST_SIMPLE]
URL_POSTS_INACCURATE = URL_POSTS.append(URL_POST_RANDOM)

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
    for url_post in URL_POSTS:
        response = requests.post(url=url_post, data=data, timeout=10)
        assert response.status_code == 200
        assert response.text == result
    response = requests.post(url=URL_POST_RANDOM, data=data, timeout=10)
    assert response.status_code == 200

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
    for url_post in URL_POSTS:
        response = requests.post(url=url_post, data=data, timeout=10)
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
    for url_post in URL_POSTS:
        response = requests.post(url=url_post, data=data, timeout=10)
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
    result = '''[{"id":0,"route":[]}]'''
    for url_post in URL_POSTS:
        response = requests.post(url=url_post, data=data, timeout=10)
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
    for url_post in URL_POSTS:
        response = requests.post(url=url_post, data=data, timeout=10)
        assert response.status_code == 400

def test_invalid_json_bad():
    data = '''
...///$$$RRR
    '''
    for url_post in URL_POSTS:
        response = requests.post(url=url_post, data=data, timeout=10)
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
            "position": { "x": 2, "y": 2 },
            "goal": { "x": 3, "y": 2 }
        }
    ]
}
    '''
    result = '''[{"id":0,"route":["UP","UP","UP","UP","UP"]},{"id":1,"route":["RIGHT"]}]'''
    for url_post in URL_POSTS:
        response = requests.post(url=url_post, data=data, timeout=10)
        assert response.status_code == 200
        assert response.text == result
