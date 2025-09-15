import os
import pytest
import mongomock

os.environ["MONGODB_DB"] = "crowdsim_test"

def pytest_addoption(parser):
    parser.addoption(
        "--integration",
        action="store_true",
        default=False,
        help="run integration tests against a real mongod",
    )

def pytest_configure(config):
    import pytest as _pytest
    setattr(_pytest, "config", config)

def _reset_client():
    import db.client as db_client
    try:
        db_client._client = None  
    except Exception:
        pass

@pytest.fixture
def use_mongomock(monkeypatch):
    import db.client as db_client
    _reset_client()
    monkeypatch.setattr(db_client, "MongoClient", mongomock.MongoClient)
    yield
    _reset_client()

@pytest.fixture
def clean_maps_collection():
    from db.client import get_db
    from db.config import MAPS_COLLECTION
    col = get_db()[MAPS_COLLECTION]
    col.delete_many({})
    yield
    col.delete_many({})

@pytest.fixture(scope="session")
def mongo_running():
    from pymongo import MongoClient
    uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    try:
        MongoClient(uri).admin.command("ping")
        return True
    except Exception:
        return False

