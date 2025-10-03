from __future__ import annotations
import json
import types
import pytest
from bson import ObjectId
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

import app as app_module  


class FakeRepo:
    """Простейший in-memory репозиторий с API как у MongoMapRepository."""
    def __init__(self):
        self._store = {}  

    
    def create(self, m):
        d = m.to_bson()
        oid = d.get("_id") or ObjectId()
        d["_id"] = oid
        self._store[str(oid)] = d
        return oid

    def list(self, limit: int = 50):
        return list(map(app_module.MapDoc.from_bson, self._store.values()))

    def get(self, map_id):
        d = self._store.get(str(map_id))
        if not d:
            return None
        return app_module.MapDoc.from_bson(d)


@pytest.fixture(autouse=True)
def patch_repo_and_config(monkeypatch):
    """Подменяем repo и отключаем реальный CPP бекенд адрес (на время тестов)."""
    fake_repo = FakeRepo()
    monkeypatch.setattr(app_module, "repo", fake_repo, raising=True)
    monkeypatch.setattr(app_module, "CPP_BACKEND_URL", "http://fake/route", raising=True)
    return fake_repo


@pytest.fixture
def client():
    """Flask test client."""
    app = app_module.app
    app.testing = True
    return app.test_client()


class FakeResp:
    def __init__(self, json_obj, status_code=200):
        self._json_obj = json_obj
        self.status_code = status_code
        self.text = json.dumps(json_obj)
    def json(self):
        return self._json_obj
    def raise_for_status(self):
        if not (200 <= self.status_code < 300):
            raise RuntimeError(f"HTTP {self.status_code}")


@pytest.fixture
def mock_requests(monkeypatch):
    sent = {"calls": []}  

    def fake_post(url, *args, **kwargs):
        body_text = kwargs.get("data")
        json_body = kwargs.get("json")
        headers = kwargs.get("headers", {})
        sent["calls"].append({"url": url, "body_text": body_text, "json_body": json_body, "headers": headers})
        return FakeResp([{"id": 1, "route": ["UP", "RIGHT"]}], status_code=200)

    monkeypatch.setattr(app_module.requests, "post", fake_post)
    return sent

