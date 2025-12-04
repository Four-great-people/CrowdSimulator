from __future__ import annotations

from copy import deepcopy
import json
import os
import sys

import pytest
from bson import ObjectId
from flask_jwt_extended import create_access_token

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

import app as app_module  # pylint: disable=wrong-import-position


class FakeRepo:
    """Простейший in-memory репозиторий с API как у MongoMapRepository."""

    def __init__(self):
        self._store_maps: dict[str, dict] = {}
        self._store_anims: dict[str, dict] = {}

    # ------- карты -------

    def create(self, m):
        d = m.to_bson()
        oid = d.get("_id") or ObjectId()
        d["_id"] = oid
        self._store_maps[str(oid)] = d
        return oid

    def list(self, limit: int = 50):  # pylint: disable=unused-argument
        return [app_module.MapDoc.from_bson(d) for d in self._store_maps.values()]

    def list_for_user(self, user_id: ObjectId, limit: int = 50):  # pylint: disable=unused-argument
        return self.list(limit)

    def get(self, map_id):
        d = self._store_maps.get(str(map_id))
        return app_module.MapDoc.from_bson(d) if d else None

    def create_animation(self, d: dict) -> ObjectId:
        oid = d.get("_id") or ObjectId()
        d["_id"] = oid
        self._store_anims[str(oid)] = d
        return d["_id"]

    def get_animation_for_user(
        self,
        animation_id: str | ObjectId,
        user_id: ObjectId, # pylint: disable=unused-argument
    ):
        try:
            oid = ObjectId(animation_id) if isinstance(animation_id, str) else animation_id
        except Exception:
            return None
        d = self._store_anims[str(oid)]
        return app_module.AnimationDoc.from_bson(d) if d else None

    def clone_animation_for_user(
        self,
        animation_id: str | ObjectId,
        user_id: ObjectId, # pylint: disable=unused-argument
    ):
        try:
            oid = ObjectId(animation_id) if isinstance(animation_id, str) else animation_id
        except Exception:
            return None
        d = self._store_anims[str(oid)]
        new_id = ObjectId()
        self._store_anims[str(new_id)] = deepcopy(d)
        return new_id

    def get_animations_for_user(
        self,
        user_id: ObjectId, # pylint: disable=unused-argument
        limit: int = 1000, # pylint: disable=unused-argument
    ):
        return [
            app_module.AnimationDoc.from_bson(d)
            for d in self._store_anims.values()
        ]

    def update_animation_name_for_user(
        self,
        animation_id: str,
        user_id: ObjectId, # pylint: disable=unused-argument
        new_name: str,
    ) -> bool:
        try:
            oid = ObjectId(animation_id) if isinstance(animation_id, str) else animation_id
            self._store_anims[str(oid)]["name"] = new_name
            return True
        except Exception:  # noqa: BLE001
            return False

    def update_animation_for_user(
        self,
        animation_id: str,
        user_id: ObjectId, # pylint: disable=unused-argument
        new_blocks: list,
        new_statistics: dict,
    ) -> bool:
        try:
            oid = ObjectId(animation_id) if isinstance(animation_id, str) else animation_id
            self._store_anims[str(oid)]["blocks"] = new_blocks
            self._store_anims[str(oid)]["statistics"] = new_statistics
            return True
        except Exception:  # noqa: BLE001
            return False

    def delete_animation_for_user(
        self,
        animation_id: str | ObjectId,
        user_id: ObjectId, # pylint: disable=unused-argument
    ) -> bool:
        try:
            oid = ObjectId(animation_id) if isinstance(animation_id, str) else animation_id
        except Exception:
            return False
        try:
            del self._store_anims[str(oid)]
            return True
        except Exception:
            return False

    def get_map_for_user(self, map_id, user_id: ObjectId):  # pylint: disable=unused-argument
        return self.get(map_id)

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


@pytest.fixture
def auth_headers(client): # pylint: disable=redefined-outer-name
    """Создаём валидный JWT токен без обращения к базе."""
    app = client.application
    with app.app_context():
        token = create_access_token(identity="000000000000000000000000")
    return {"Authorization": f"Bearer {token}"}


class FakeResp:
    def __init__(self, json_obj, status_code=200):
        self._json_obj = json_obj
        self.status_code = status_code
        self.text = json.dumps(json_obj)

    def json(self):
        return self._json_obj

    def raise_for_status(self):
        if not 200 <= self.status_code < 300:
            raise RuntimeError(f"HTTP {self.status_code}")


@pytest.fixture
def mock_requests(monkeypatch):
    sent = {"calls": []}

    def fake_post(url, *args, **kwargs):  # pylint: disable=unused-argument
        body_text = kwargs.get("data")
        json_body = kwargs.get("json")
        headers = kwargs.get("headers", {})
        sent["calls"].append(
            {"url": url, "body_text": body_text, "json_body": json_body, "headers": headers}
        )
        if "simple" in url:
            return FakeResp([{"id": 1, "route": ["UP", "RIGHT", "LEFT_DOWN"]}], status_code=200)
        if "dense" in url:
            return FakeResp([{"id": 1, "route": None}], status_code=200)
        return FakeResp([{"id": 1, "route": ["UP", "RIGHT"]}], status_code=200)

    monkeypatch.setattr(app_module.requests, "post", fake_post)
    return sent
