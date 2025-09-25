import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

app = FastAPI()


@pytest.fixture
def client():
    return TestClient(app)
