import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from main import app
from api.v1.endpoints import idea_missions as idea_mod


@pytest.fixture()
def client(tmp_path, monkeypatch) -> TestClient:
    data_dir = tmp_path / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    monkeypatch.setattr(idea_mod, "DATA_DIR", data_dir, raising=False)
    monkeypatch.setattr(idea_mod, "STORE_FILE", data_dir / "idea_missions.json", raising=False)
    return TestClient(app)


def _create_mission(client: TestClient) -> str:
    resp = client.post(
        "/api/v1/idea-missions",
        json={"userId": "u1", "title": "Test Mission", "description": "desc"},
    )
    body = resp.json()
    assert resp.status_code == 200 and body.get("success") is True
    return body["data"]["id"]


def test_planning_execution_persists_chat(client: TestClient, tmp_path: Path):
    mission_id = _create_mission(client)

    # Execute planning (uses DSPy if available, else mock), should persist chat
    resp = client.post(
        f"/api/v1/idea-missions/{mission_id}/agents/planning/execute",
        json={"userId": "u1", "message": "plan it", "history": []},
    )
    body = resp.json()
    assert resp.status_code == 200 and body.get("success") is True
    message_id = body["data"]["messageId"]
    assert message_id

    # Check chat persisted (two messages: user + assistant)
    chat_path = idea_mod._chat_path(mission_id)
    assert chat_path.exists()
    chat = json.loads(chat_path.read_text())
    assert len(chat) >= 2
    assert any(m.get("role") == "assistant" for m in chat)


def test_artifact_crud_persists_files_and_manifest(client: TestClient, tmp_path: Path):
    mission_id = _create_mission(client)

    # Add external text artifact
    resp = client.post(
        f"/api/v1/idea-missions/{mission_id}/artifacts/text",
        json={"userId": "u1", "name": "note", "content": "hello", "format": "markdown"},
    )
    body = resp.json()
    assert resp.status_code == 200 and body.get("success") is True
    art = body["data"]["artifact"]
    art_id = art["id"]

    # List artifacts should include it and file should exist
    resp = client.get(f"/api/v1/idea-missions/{mission_id}/artifacts")
    items = resp.json()["data"]
    assert any(a["id"] == art_id for a in items)
    saved_path = idea_mod._mission_dir(mission_id) / art["path"]
    assert saved_path.exists()

    # Rename and edit content
    resp = client.patch(
        f"/api/v1/idea-missions/{mission_id}/artifacts/{art_id}",
        json={"name": "renamed", "content": "updated"},
    )
    upd = resp.json()["data"]
    assert upd["name"].startswith("renamed")
    new_path = idea_mod._mission_dir(mission_id) / upd["path"]
    assert new_path.exists()
    assert new_path.read_text(encoding="utf-8") == "updated"

    # Delete
    resp = client.delete(f"/api/v1/idea-missions/{mission_id}/artifacts/{art_id}")
    assert resp.status_code == 200 and resp.json().get("success") is True
    # Manifest updated
    items_after = client.get(f"/api/v1/idea-missions/{mission_id}/artifacts").json()["data"]
    assert all(a["id"] != art_id for a in items_after)


def test_save_message_as_artifact_then_list(client: TestClient):
    mission_id = _create_mission(client)
    exec_resp = client.post(
        f"/api/v1/idea-missions/{mission_id}/agents/planning/execute",
        json={"userId": "u1", "message": "save this", "history": []},
    ).json()
    msg_id = exec_resp["data"]["messageId"]
    resp = client.post(
        f"/api/v1/idea-missions/{mission_id}/messages/{msg_id}/save",
        json={"userId": "u1", "content": "content body", "format": "markdown", "filenameHint": "test"},
    )
    body = resp.json()
    assert resp.status_code == 200 and body.get("success") is True
    art = body["data"]["artifact"]
    # Assert content on disk equals what we saved
    p = idea_mod._mission_dir(mission_id) / art["path"]
    assert p.exists() and p.read_text(encoding="utf-8") == "content body"
    # Listed
    man = client.get(f"/api/v1/idea-missions/{mission_id}/artifacts").json()["data"]
    assert any("planning_test" in a["name"] for a in man)


def test_file_context_persist_roundtrip(client: TestClient):
    mission_id = _create_mission(client)
    items = [
        {"id": "f1", "name": "file1.md", "prompt": "do X", "selected": True},
        {"id": "f2", "name": "file2.md", "prompt": "", "selected": False},
    ]
    put = client.put(f"/api/v1/idea-missions/{mission_id}/file-context", json=items)
    assert put.status_code == 200 and put.json().get("success") is True
    got = client.get(f"/api/v1/idea-missions/{mission_id}/file-context").json()["data"]
    assert got == items


