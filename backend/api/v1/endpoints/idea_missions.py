"""
Idea Mission endpoints with JSON-file persistence (Option A)
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from pathlib import Path
import json
import asyncio
from datetime import datetime
import os

from utils.helpers import generate_id, get_timestamp, create_success_response

router = APIRouter()

# Storage paths
BASE_DIR = Path(__file__).resolve().parents[3]  # points to backend/
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
STORE_FILE = DATA_DIR / "idea_missions.json"

# Concurrency control
store_lock = asyncio.Lock()


class IdeaMissionModel(BaseModel):
    id: str
    userId: str
    title: str
    description: Optional[str] = None
    status: str = Field(default="CREATED")
    documentGroupIds: List[str] = Field(default_factory=list)
    createdAt: str
    updatedAt: str
    completedAt: Optional[str] = None


class CreateIdeaMissionRequest(BaseModel):
    userId: str
    title: str
    description: Optional[str] = None
    documentGroupId: Optional[str] = None
    documentGroupIds: Optional[List[str]] = None


class UpdateIdeaMissionRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    documentGroupIds: Optional[List[str]] = None


def _read_store() -> List[Dict[str, Any]]:
    if not STORE_FILE.exists():
        return []
    try:
        with STORE_FILE.open("r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
            return []
    except Exception:
        return []


def _write_store(missions: List[Dict[str, Any]]):
    tmp_file = STORE_FILE.with_suffix(".tmp")
    with tmp_file.open("w", encoding="utf-8") as f:
        json.dump(missions, f, ensure_ascii=False, indent=2)
    tmp_file.replace(STORE_FILE)


# Per-mission storage utilities
def _mission_dir(mission_id: str) -> Path:
    d = DATA_DIR / "idea_missions" / mission_id
    d.mkdir(parents=True, exist_ok=True)
    (d / "artifacts").mkdir(parents=True, exist_ok=True)
    return d

def _manifest_path(mission_id: str) -> Path:
    return _mission_dir(mission_id) / "manifest.json"

def _feedback_path(mission_id: str) -> Path:
    return _mission_dir(mission_id) / "feedback.json"
def _chat_path(mission_id: str) -> Path:
    return _mission_dir(mission_id) / "chat.json"

def _read_json(path: Path, default):
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding='utf-8'))
    except Exception:
        return default

def _write_json(path: Path, data):
    tmp = path.with_suffix('.tmp')
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
    tmp.replace(path)


@router.get("/idea-missions")
async def list_idea_missions(userId: Optional[str] = Query(None)):
    """List idea missions, optionally filtered by userId"""
    async with store_lock:
        missions = _read_store()
    if userId:
        missions = [m for m in missions if m.get("userId") == userId]
    return create_success_response(missions, "Idea missions retrieved")


@router.get("/idea-missions/{mission_id}")
async def get_idea_mission(mission_id: str):
    async with store_lock:
        missions = _read_store()
    for m in missions:
        if m.get("id") == mission_id:
            return create_success_response(m, "Idea mission retrieved")
    raise HTTPException(status_code=404, detail="Idea mission not found")


@router.post("/idea-missions")
async def create_idea_mission(req: CreateIdeaMissionRequest):
    now = get_timestamp()
    new_mission: Dict[str, Any] = {
        "id": generate_id("idea"),
        "userId": req.userId,
        "title": req.title,
        "description": req.description,
        "status": "CREATED",
        "documentGroupIds": req.documentGroupIds or ([req.documentGroupId] if req.documentGroupId else []),
        "createdAt": now,
        "updatedAt": now,
        "completedAt": None,
    }
    async with store_lock:
        missions = _read_store()
        missions.insert(0, new_mission)
        _write_store(missions)
    return create_success_response(new_mission, "Idea mission created")


@router.patch("/idea-missions/{mission_id}")
async def update_idea_mission(mission_id: str, req: UpdateIdeaMissionRequest):
    async with store_lock:
        missions = _read_store()
        for idx, m in enumerate(missions):
            if m.get("id") == mission_id:
                if req.title is not None:
                    m["title"] = req.title
                if req.description is not None:
                    m["description"] = req.description
                if req.status is not None:
                    m["status"] = req.status
                    if req.status == "COMPLETED":
                        m["completedAt"] = get_timestamp()
                if req.documentGroupIds is not None:
                    m["documentGroupIds"] = req.documentGroupIds
                m["updatedAt"] = get_timestamp()
                missions[idx] = m
                _write_store(missions)
                return create_success_response(m, "Idea mission updated")
    raise HTTPException(status_code=404, detail="Idea mission not found")


@router.delete("/idea-missions/{mission_id}")
async def delete_idea_mission(mission_id: str):
    async with store_lock:
        missions = _read_store()
        new_list = [m for m in missions if m.get("id") != mission_id]
        if len(new_list) == len(missions):
            raise HTTPException(status_code=404, detail="Idea mission not found")
        _write_store(new_list)
    return create_success_response({"id": mission_id}, "Idea mission deleted")


# --- Planning Agent execution (stateless) ---
class ChatHistoryItem(BaseModel):
    id: Optional[str] = None
    role: str
    content: str
    timestamp: Optional[str] = None

class ExecutePlanningRequest(BaseModel):
    userId: str
    message: str
    history: Optional[List[ChatHistoryItem]] = None
    documentGroupIds: Optional[List[str]] = None
    config: Optional[Dict[str, Any]] = None

@router.post("/idea-missions/{mission_id}/agents/planning/execute")
async def execute_planning_agent(mission_id: str, req: ExecutePlanningRequest):
    """Run a simple DSPy-based planning brainstorm using local Ollama model.
    If DSPy/Ollama is unavailable, gracefully fall back to a heuristic markdown plan."""

    def mock_plan(message: str, history_text: str) -> str:
        return (
            f"### Objectives\n"
            f"- Develop a clear plan for: {message}\n\n"
            f"### Assumptions\n"
            f"- Access to necessary data and compute.\n- Feasible scope within current constraints.\n\n"
            f"### Approach\n"
            f"1) Clarify requirements and success criteria.\n"
            f"2) Design baseline and improved methods.\n"
            f"3) Evaluate with small experiments.\n"
            f"4) Iterate and document outcomes.\n\n"
            f"### Milestones\n"
            f"- Week 1: Problem framing and baseline.\n"
            f"- Week 2: First experiments and analysis.\n"
            f"- Week 3: Refinements and report draft.\n\n"
            f"### Risks\n- Data quality, evaluation mismatch, time constraints.\n\n"
            f"### Deliverables\n- Brief report, experimental results, next-step recommendations.\n\n"
            f"---\nHistory summary (last messages):\n{history_text}"
        )

    # Build brief context from recent history
    history = req.history or []
    context_lines = []
    for h in history[-6:]:
        role = (h.role or "user")[:6].upper()
        context_lines.append(f"{role}: {h.content}")
    context_text = "\n".join(context_lines)

    answer: str
    mode: str = "mock"
    try:
        try:
            import dspy  # type: ignore
        except Exception:
            dspy = None  # type: ignore

        if dspy is None:
            answer = mock_plan(req.message, context_text)
        else:
            # Configure per call (allows env overrides)
            api_base = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
            model = os.getenv('PLANNING_MODEL', 'ollama_chat/qwen3:4b')
            dspy.configure(lm=dspy.LM(model, api_base=api_base, api_key=''))

            class PlanningBrainstorm(dspy.Module):
                def __init__(self):
                    super().__init__()
                    self.predict = dspy.Predict("instruction, context -> plan")

                def forward(self, instruction: str, context: str):
                    return self.predict(instruction=instruction, context=context)

            instruction = (
                "You are a Planning Agent. Brainstorm a structured plan for the user's idea. "
                "Provide a concise markdown plan with sections: Objectives, Assumptions, Approach, Milestones, Risks, Deliverables."
            )
            module = PlanningBrainstorm()
            out = module(instruction=instruction, context=f"User: {req.message}\n\nHistory:\n{context_text}")
            answer = out.plan if hasattr(out, 'plan') else str(out)
            mode = "model"
    except Exception:
        # Final fallback to ensure 200 response
        answer = mock_plan(req.message, context_text)
        mode = "mock"

    execution_id = generate_id("exec")
    assistant_message_id = generate_id("msg")
    user_message_id = generate_id("msg")

    # Persist both user and assistant messages in chat history
    chat_path = _chat_path(mission_id)
    chat = _read_json(chat_path, [])
    chat.append({
        "id": user_message_id,
        "role": "user",
        "content": req.message,
        "timestamp": get_timestamp(),
    })
    chat.append({
        "id": assistant_message_id,
        "role": "assistant",
        "content": answer,
        "timestamp": get_timestamp(),
        "agentId": "planning",
        "agentName": "Planning Agent",
        "agentIcon": "target",
        "metadata": {"mode": mode},
    })
    _write_json(chat_path, chat)

    return create_success_response({
        "executionId": execution_id,
        "messageId": assistant_message_id,
        "userMessageId": user_message_id,
        "agent": "planning",
        "answer": answer,
        "mode": mode,
        "usage": {},
    }, "Planning agent completed")


# --- Feedback (thumbs up/down) ---
class FeedbackRequest(BaseModel):
    userId: str
    rating: str  # 'up' | 'down'
    reason: Optional[str] = None

@router.post("/idea-missions/{mission_id}/messages/{message_id}/feedback")
async def submit_feedback(mission_id: str, message_id: str, req: FeedbackRequest):
    try:
        fb_path = _feedback_path(mission_id)
        data = _read_json(fb_path, [])
        data.append({
            "messageId": message_id,
            "userId": req.userId,
            "rating": req.rating,
            "reason": req.reason,
            "timestamp": get_timestamp(),
        })
        _write_json(fb_path, data)
        return create_success_response({"messageId": message_id, "rating": req.rating}, "Feedback saved")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save feedback: {str(e)}")


# --- Save message as artifact ---
class SaveMessageRequest(BaseModel):
    userId: str
    content: str
    format: Optional[str] = "markdown"  # markdown|text|json
    filenameHint: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

@router.post("/idea-missions/{mission_id}/messages/{message_id}/save")
async def save_message_as_artifact(mission_id: str, message_id: str, req: SaveMessageRequest):
    try:
        mission_dir = _mission_dir(mission_id)
        manifest_path = _manifest_path(mission_id)
        manifest = _read_json(manifest_path, [])

        # Ensure the message exists in chat history before saving
        chat = _read_json(_chat_path(mission_id), [])
        if not any(m.get('id') == message_id for m in chat):
            raise HTTPException(status_code=404, detail='Message not found')

        ext = 'md' if req.format == 'markdown' else ('json' if req.format == 'json' else 'txt')
        hint = req.filenameHint or 'idea-plan'
        timestamp = get_timestamp().replace(':', '-').replace('T', '_').split('.')[0]
        name = f"planning_{hint}.{ext}"
        filename = f"{timestamp}_{name}"
        file_path = mission_dir / 'artifacts' / filename

        # Write content
        content_str = req.content if isinstance(req.content, str) else json.dumps(req.content, ensure_ascii=False, indent=2)
        tmp = file_path.with_suffix(file_path.suffix + '.tmp')
        tmp.write_text(content_str, encoding='utf-8')
        tmp.replace(file_path)

        artifact_id = generate_id('file')
        record = {
            "id": artifact_id,
            "name": name,
            "type": req.format,
            "size": len(content_str.encode('utf-8')),
            "createdAt": get_timestamp(),
            "path": f"artifacts/{filename}",
            "agent": "planning",
            "messageId": message_id,
            "metadata": req.metadata or {},
          }
        manifest.insert(0, record)
        _write_json(manifest_path, manifest)

        return create_success_response({
            "artifact": {
                **record,
                "downloadUrl": f"/api/v1/idea-missions/{mission_id}/files/{artifact_id}",
            }
        }, "Artifact saved")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save artifact: {str(e)}")


@router.get("/idea-missions/{mission_id}/artifacts")
async def list_artifacts(mission_id: str):
    manifest = _read_json(_manifest_path(mission_id), [])
    return create_success_response(manifest, "Artifacts listed")


class UpdateArtifactRequest(BaseModel):
    name: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

@router.patch("/idea-missions/{mission_id}/artifacts/{artifact_id}")
async def update_artifact(mission_id: str, artifact_id: str, req: UpdateArtifactRequest):
    manifest_path = _manifest_path(mission_id)
    manifest = _read_json(manifest_path, [])
    for rec in manifest:
        if rec.get('id') == artifact_id:
            # Apply metadata changes
            if req.metadata is not None:
                meta = rec.get('metadata') or {}
                meta.update(req.metadata)
                rec['metadata'] = meta
            # Handle rename (also rename file on disk)
            if req.name and req.name != rec.get('name'):
                old_path = _mission_dir(mission_id) / rec.get('path')
                timestamp_prefix = rec.get('path', '').split('/')[-1].split('_', 1)[0]
                # Ensure extension
                new_name = req.name
                if '.' not in new_name:
                    # fall back to old extension
                    old_ext = ''.join(Path(rec.get('name', 'artifact.md')).suffixes) or '.md'
                    new_name = f"{new_name}{old_ext}"
                new_filename = f"{timestamp_prefix}_{new_name}"
                new_path = _mission_dir(mission_id) / 'artifacts' / new_filename
                try:
                    if old_path.exists():
                        old_path.rename(new_path)
                    rec['name'] = new_name
                    rec['path'] = f"artifacts/{new_filename}"
                except Exception as e:
                    raise HTTPException(status_code=500, detail=f"Rename failed: {str(e)}")
            _write_json(manifest_path, manifest)
            return create_success_response(rec, "Artifact updated")
    raise HTTPException(status_code=404, detail='Artifact not found')


@router.delete("/idea-missions/{mission_id}/artifacts/{artifact_id}")
async def delete_artifact(mission_id: str, artifact_id: str):
    manifest_path = _manifest_path(mission_id)
    manifest = _read_json(manifest_path, [])
    new_list = []
    deleted = None
    for rec in manifest:
        if rec.get('id') == artifact_id:
            deleted = rec
            # Try removing file
            try:
                p = _mission_dir(mission_id) / rec.get('path')
                if p.exists():
                    p.unlink()
            except Exception:
                pass
        else:
            new_list.append(rec)
    if not deleted:
        raise HTTPException(status_code=404, detail='Artifact not found')
    _write_json(manifest_path, new_list)
    return create_success_response({"id": artifact_id}, "Artifact deleted")


@router.get("/idea-missions/{mission_id}/files/{file_id}")
async def download_artifact(mission_id: str, file_id: str):
    from fastapi.responses import FileResponse
    manifest = _read_json(_manifest_path(mission_id), [])
    for rec in manifest:
        if rec.get('id') == file_id:
            path = _mission_dir(mission_id) / rec.get('path')
            if not path.exists():
                raise HTTPException(status_code=404, detail='File not found')
            return FileResponse(str(path), filename=rec.get('name') or 'artifact')
    raise HTTPException(status_code=404, detail='Artifact not found')


# --- Add external text file ---
class AddTextArtifactRequest(BaseModel):
    userId: str
    name: str  # filename without extension ok
    content: str
    format: Optional[str] = "markdown"  # markdown|text|json
    metadata: Optional[Dict[str, Any]] = None

@router.post("/idea-missions/{mission_id}/artifacts/text")
async def add_text_artifact(mission_id: str, req: AddTextArtifactRequest):
    try:
        mission_dir = _mission_dir(mission_id)
        manifest_path = _manifest_path(mission_id)
        manifest = _read_json(manifest_path, [])

        ext = 'md' if req.format == 'markdown' else ('json' if req.format == 'json' else 'txt')
        base = req.name.rstrip().replace('/', '-') or 'note'
        timestamp = get_timestamp().replace(':', '-').replace('T', '_').split('.')[0]
        name = f"{base}.{ext}"
        filename = f"{timestamp}_{name}"
        file_path = mission_dir / 'artifacts' / filename

        tmp = file_path.with_suffix(file_path.suffix + '.tmp')
        content_str = req.content if isinstance(req.content, str) else json.dumps(req.content, ensure_ascii=False, indent=2)
        tmp.write_text(content_str, encoding='utf-8')
        tmp.replace(file_path)

        artifact_id = generate_id('file')
        record = {
            "id": artifact_id,
            "name": name,
            "type": req.format,
            "size": len(content_str.encode('utf-8')),
            "createdAt": get_timestamp(),
            "path": f"artifacts/{filename}",
            "agent": "external",
            "messageId": None,
            "metadata": req.metadata or {},
        }
        manifest.insert(0, record)
        _write_json(manifest_path, manifest)

        return create_success_response({ "artifact": { **record, "downloadUrl": f"/api/v1/idea-missions/{mission_id}/files/{artifact_id}" } }, "Artifact added")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add artifact: {str(e)}")


# --- Chat history ---
@router.get("/idea-missions/{mission_id}/chat")
async def get_chat_history(mission_id: str):
    chat = _read_json(_chat_path(mission_id), [])
    return create_success_response(chat, "Chat history")

class AppendMessageRequest(BaseModel):
    id: Optional[str] = None
    role: str
    content: str
    agentId: Optional[str] = None
    agentName: Optional[str] = None
    agentIcon: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

@router.post("/idea-missions/{mission_id}/chat")
async def append_chat_message(mission_id: str, req: AppendMessageRequest):
    chat_path = _chat_path(mission_id)
    chat = _read_json(chat_path, [])
    msg_id = req.id or generate_id('msg')
    record = {
        "id": msg_id,
        "role": req.role,
        "content": req.content,
        "timestamp": get_timestamp(),
        "agentId": req.agentId,
        "agentName": req.agentName,
        "agentIcon": req.agentIcon,
        "metadata": req.metadata or {},
    }
    chat.append(record)
    _write_json(chat_path, chat)
    return create_success_response(record, "Message appended")


