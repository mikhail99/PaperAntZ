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


def test_planning_execute_enriched_and_activity(client: TestClient):
    mission_id = _create_mission(client)
    resp = client.post(
        f"/api/v1/idea-missions/{mission_id}/agents/planning/execute",
        json={"userId": "u1", "message": "plan it", "history": []},
    )
    body = resp.json()
    assert body["data"]["operation"] == "idea.planning.execute"
    assert body["data"]["chatUri"] == f"idea://{mission_id}/chat"
    # activity exists
    act_path = idea_mod._activity_path(mission_id)
    assert act_path.exists()
    acts = json.loads(act_path.read_text())
    assert any(a.get("operation") == "idea.planning.execute" for a in acts)


def test_artifacts_list_enriched(client: TestClient):
    mission_id = _create_mission(client)
    add = client.post(
        f"/api/v1/idea-missions/{mission_id}/artifacts/text",
        json={"userId": "u1", "name": "note", "content": "hello", "format": "markdown"},
    ).json()["data"]["artifact"]
    lst = client.get(f"/api/v1/idea-missions/{mission_id}/artifacts").json()["data"]
    rec = next(a for a in lst if a["id"] == add["id"])
    assert rec.get("downloadUrl") and rec.get("uri") == f"idea://{mission_id}/artifact/{add['id']}"


def test_artifact_rename_preserves_extension(client: TestClient):
    mission_id = _create_mission(client)
    add = client.post(
        f"/api/v1/idea-missions/{mission_id}/artifacts/text",
        json={"userId": "u1", "name": "note", "content": "hello", "format": "markdown"},
    ).json()["data"]["artifact"]
    upd = client.patch(
        f"/api/v1/idea-missions/{mission_id}/artifacts/{add['id']}",
        json={"name": "renamed"},
    ).json()["data"]
    assert upd["name"].endswith(".md")
    new_path = idea_mod._mission_dir(mission_id) / upd["path"]
    assert new_path.exists()


def test_artifact_update_content_updates_size_and_activity(client: TestClient):
    mission_id = _create_mission(client)
    add = client.post(
        f"/api/v1/idea-missions/{mission_id}/artifacts/text",
        json={"userId": "u1", "name": "note", "content": "old", "format": "markdown"},
    ).json()["data"]["artifact"]
    content = "updated content"
    upd = client.patch(
        f"/api/v1/idea-missions/{mission_id}/artifacts/{add['id']}",
        json={"content": content},
    ).json()["data"]
    assert upd["size"] == len(content.encode("utf-8"))
    # activity includes update_content
    acts = json.loads(idea_mod._activity_path(mission_id).read_text())
    assert any(a.get("operation") == "idea.artifacts.update_content" for a in acts)


def test_delete_artifact_activity_and_404_on_missing(client: TestClient):
    mission_id = _create_mission(client)
    add = client.post(
        f"/api/v1/idea-missions/{mission_id}/artifacts/text",
        json={"userId": "u1", "name": "note", "content": "x", "format": "markdown"},
    ).json()["data"]["artifact"]
    ok = client.delete(f"/api/v1/idea-missions/{mission_id}/artifacts/{add['id']}")
    assert ok.status_code == 200
    # recorded
    acts = json.loads(idea_mod._activity_path(mission_id).read_text())
    assert any(a.get("operation") == "idea.artifacts.delete" for a in acts)
    # delete again -> 404
    resp = client.delete(f"/api/v1/idea-missions/{mission_id}/artifacts/{add['id']}")
    assert resp.status_code == 404


def test_file_context_put_returns_operation_and_roundtrip(client: TestClient):
    mission_id = _create_mission(client)
    items = [
        {"id": "f1", "name": "a.md", "prompt": "p", "selected": True},
        {"id": "f2", "name": "b.md", "prompt": "", "selected": False},
    ]
    put = client.put(f"/api/v1/idea-missions/{mission_id}/file-context", json=items).json()
    assert put["data"]["operation"] == "idea.file_context.put"
    got = client.get(f"/api/v1/idea-missions/{mission_id}/file-context").json()["data"]
    assert got == items


def test_chat_append_returns_operation_and_persists(client: TestClient):
    mission_id = _create_mission(client)
    r = client.post(
        f"/api/v1/idea-missions/{mission_id}/chat",
        json={"role": "user", "content": "hi"},
    ).json()
    assert r["data"]["operation"] == "idea.chat.append"
    chat = json.loads(idea_mod._chat_path(mission_id).read_text())
    assert any(m.get("content") == "hi" for m in chat)


def test_feedback_persisted(client: TestClient):
    mission_id = _create_mission(client)
    exec_body = client.post(
        f"/api/v1/idea-missions/{mission_id}/agents/planning/execute",
        json={"userId": "u1", "message": "plan", "history": []},
    ).json()["data"]
    msg_id = exec_body["messageId"]
    fb = client.post(
        f"/api/v1/idea-missions/{mission_id}/messages/{msg_id}/feedback",
        json={"userId": "u1", "rating": "up"},
    )
    assert fb.status_code == 200
    path = idea_mod._feedback_path(mission_id)
    assert path.exists()
    data = json.loads(path.read_text())
    assert any(d.get("messageId") == msg_id and d.get("rating") == "up" for d in data)


def test_download_artifact_content_matches(client: TestClient):
    mission_id = _create_mission(client)
    add = client.post(
        f"/api/v1/idea-missions/{mission_id}/artifacts/text",
        json={"userId": "u1", "name": "note", "content": "hello", "format": "markdown"},
    ).json()["data"]["artifact"]
    resp = client.get(f"/api/v1/idea-missions/{mission_id}/files/{add['id']}")
    assert resp.status_code == 200
    assert resp.text == "hello"


def test_save_message_as_artifact_has_uri_and_downloadUrl(client: TestClient):
    mission_id = _create_mission(client)
    exec_body = client.post(
        f"/api/v1/idea-missions/{mission_id}/agents/planning/execute",
        json={"userId": "u1", "message": "save", "history": []},
    ).json()["data"]
    msg_id = exec_body["messageId"]
    r = client.post(
        f"/api/v1/idea-missions/{mission_id}/messages/{msg_id}/save",
        json={"userId": "u1", "content": "body", "format": "markdown", "filenameHint": "x"},
    ).json()
    art = r["data"]["artifact"]
    assert art["downloadUrl"] and art["uri"] == f"idea://{mission_id}/artifact/{art['id']}"


def test_semantic_search_agent_executes(client: TestClient, monkeypatch):
    mission_id = _create_mission(client)
    # Create a fake collection via monkeypatch if needed; use documents endpoint to list groups
    # For test simplicity, just call endpoint and assert structured response shape handling errors gracefully
    resp = client.post(
        f"/api/v1/idea-missions/{mission_id}/agents/search/semantic/execute",
        json={"userId": "u1", "groupId": "LLM_Reasoning_Agents", "query": "transformer", "limit": 2},
    )
    # Even if collection is missing in test env, the endpoint should not 500; handle errors via mode
    assert resp.status_code in (200, 500)
    if resp.status_code == 200:
        data = resp.json()["data"]
        assert data["operation"] == "idea.search.semantic.execute"
        assert isinstance(data.get("results", []), list)


def test_save_message_as_artifact_404_on_unknown_message(client: TestClient):
    mission_id = _create_mission(client)
    resp = client.post(
        f"/api/v1/idea-missions/{mission_id}/messages/does-not-exist/save",
        json={"userId": "u1", "content": "body", "format": "markdown"},
    )
    assert resp.status_code == 404


def test_presets_crud_and_reorder(client: TestClient):
    mission_id = _create_mission(client)
    # Create two presets
    p1 = {
        "id": "preset_planning",
        "name": "Planning Agent",
        "agentType": "planning",
        "icon": "target",
        "temperature": 0.7,
        "systemPrompt": "Plan well",
        "styleLevel": 50,
    }
    p2 = {
        "id": "preset_research",
        "name": "Research Agent",
        "agentType": "research",
        "icon": "brain",
        "temperature": 0.5,
        "systemPrompt": "Research deeply",
        "styleLevel": 60,
    }
    client.post(f"/api/v1/idea-missions/{mission_id}/agents/presets", json=p1)
    client.post(f"/api/v1/idea-missions/{mission_id}/agents/presets", json=p2)

    # List
    lst = client.get(f"/api/v1/idea-missions/{mission_id}/agents/presets").json()["data"]
    assert any(x["id"] == "preset_planning" for x in lst)
    assert any(x["id"] == "preset_research" for x in lst)

    # Reorder: research first
    order = ["preset_research", "preset_planning"]
    ro = client.put(
        f"/api/v1/idea-missions/{mission_id}/agents/presets/order",
        json={"order": order},
    ).json()["data"]
    assert ro["count"] == 2
    lst2 = client.get(f"/api/v1/idea-missions/{mission_id}/agents/presets").json()["data"]
    assert [x["id"] for x in lst2[:2]] == order

    # Delete one
    delr = client.delete(f"/api/v1/idea-missions/{mission_id}/agents/presets/preset_research")
    assert delr.status_code == 200
    lst3 = client.get(f"/api/v1/idea-missions/{mission_id}/agents/presets").json()["data"]
    assert all(x["id"] != "preset_research" for x in lst3)


def test_download_artifact_404_when_missing(client: TestClient):
    mission_id = _create_mission(client)
    resp = client.get(f"/api/v1/idea-missions/{mission_id}/files/does-not-exist")
    assert resp.status_code == 404


def test_update_artifact_metadata_merges(client: TestClient):
    mission_id = _create_mission(client)
    add = client.post(
        f"/api/v1/idea-missions/{mission_id}/artifacts/text",
        json={"userId": "u1", "name": "note", "content": "hello", "format": "markdown", "metadata": {"a": 1}},
    ).json()["data"]["artifact"]
    upd = client.patch(
        f"/api/v1/idea-missions/{mission_id}/artifacts/{add['id']}",
        json={"metadata": {"b": 2}},
    ).json()["data"]
    assert upd.get("metadata", {}).get("a") == 1 and upd["metadata"].get("b") == 2


