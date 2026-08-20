from fastapi.testclient import TestClient

from app.main import app


def test_health_endpoint() -> None:
    response = TestClient(app).get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"


def test_learning_contract_is_exposed_in_openapi() -> None:
    schema = TestClient(app).get("/openapi.json").json()
    assert "/api/v1/learning-sessions" in schema["paths"]
    assert "/api/v1/learning-sessions/{session_id}/answers" in schema["paths"]
    assert "/api/v1/learning-sessions/{session_id}/abandon" in schema["paths"]
    assert "/api/v1/progress/summary" in schema["paths"]
    assert "/api/v1/vocab-items/{vocab_id}/audio" in schema["paths"]
    assert "patch" in schema["paths"]["/api/v1/notebooks/{notebook_id}"]
    assert "patch" in schema["paths"]["/api/v1/vocab-items/{vocab_id}"]


def test_oversized_request_is_rejected_before_authentication() -> None:
    response = TestClient(app).post(
        "/api/v1/learning-sessions",
        content="x" * 1_048_577,
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 413
