import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.nda import NdaFormData


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def sample_nda_data() -> NdaFormData:
    return NdaFormData()
