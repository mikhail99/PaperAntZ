import json
from typing import Any
from urllib.parse import urlparse

import pytest
from fastapi.testclient import TestClient

from main import app
from api.v1.endpoints import idea_missions as idea_mod


@pytest.fixture()
def client(monkeypatch: pytest.MonkeyPatch) -> TestClient:
    # Route internal HTTP calls in semantic search to TestClient instead of localhost:8000
    monkeypatch.setenv("API_INTERNAL_BASE", "http://testserver")

    test_client = TestClient(app)

    # Patch urlopen used by idea_missions.direct_search to call into TestClient
    class _Resp:
        def __init__(self, data_bytes: bytes):
            self._data = data_bytes

        def read(self) -> bytes:
            return self._data

        def __enter__(self) -> "_Resp":
            return self

        def __exit__(self, exc_type, exc, tb) -> bool:
            return False

    def _fake_urlopen(url: str) -> Any:  # type: ignore[override]
        parsed = urlparse(url)
        path_and_query = parsed.path + (f"?{parsed.query}" if parsed.query else "")
        resp = test_client.get(path_and_query)
        return _Resp(resp.content)

    monkeypatch.setattr(idea_mod, "_urlreq", type("_U", (), {"urlopen": _fake_urlopen}))

    return test_client


def test_semantic_search_on_existing_mission(client: TestClient):
    # Mission created previously and persisted in real data store:
    mission_id = "idea_46f334b2"
    group_id = "LLM_Reasoning_Agents"

    payload = {
        "userId": "u-test",
        "groupId": group_id,
        "query": "llm for math",
        "limit": 10,
    }
    resp = client.post(f"/api/v1/idea-missions/{mission_id}/agents/search/semantic/execute", json=payload)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body.get("success") is True
    data = body.get("data") or {}
    results = data.get("results")
    assert isinstance(results, list)
    # Optional: the UI expects a markdown summary persisted in chat
    chat = client.get(f"/api/v1/idea-missions/{mission_id}/chat").json()["data"]
    assert any(m.get("agentId") == "semantic" for m in chat)


