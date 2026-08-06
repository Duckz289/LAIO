from fastapi.testclient import TestClient

from app.main import app


def test_health_endpoint() -> None:
    response = TestClient(app).get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_learning_contract_is_exposed_in_openapi() -> None:
    schema = TestClient(app).get("/openapi.json").json()
    assert "/api/v1/learning-sessions" in schema["paths"]
    assert "/api/v1/learning-sessions/{session_id}/answers" in schema["paths"]
    assert "/api/v1/learning-sessions/{session_id}/abandon" in schema["paths"]
    assert "/api/v1/progress/summary" in schema["paths"]
    assert "/api/v1/vocab-items/{vocab_id}/audio" in schema["paths"]
