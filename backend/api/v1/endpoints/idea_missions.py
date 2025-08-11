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

# Canonical operation names (MCP-ready)
OP_PLANNING_EXECUTE = "idea.planning.execute"
OP_RESEARCH_EXECUTE = "idea.research.execute"
OP_SEARCH_SEMANTIC_EXECUTE = "idea.search.semantic.execute"
OP_ARTIFACT_LIST = "idea.artifacts.list"
OP_ARTIFACT_SAVE = "idea.artifacts.save"
OP_ARTIFACT_RENAME = "idea.artifacts.rename"
OP_ARTIFACT_UPDATE_CONTENT = "idea.artifacts.update_content"
OP_ARTIFACT_DELETE = "idea.artifacts.delete"
OP_CHAT_APPEND = "idea.chat.append"
OP_FILE_CONTEXT_PUT = "idea.file_context.put"


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
def _file_context_path(mission_id: str) -> Path:
    return _mission_dir(mission_id) / "file_context.json"

def _presets_path(mission_id: str) -> Path:
    return _mission_dir(mission_id) / "agents_presets.json"

def _activity_path(mission_id: str) -> Path:
    return _mission_dir(mission_id) / "activity.json"

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


def _log_activity(mission_id: str, operation: str, args_summary: Dict[str, Any], user_id: Optional[str] = None, result: Optional[Dict[str, Any]] = None):
    """Append a lightweight activity record for auditing/analytics.
    Non-failing best-effort; never raises in request flow.
    """
    try:
        path = _activity_path(mission_id)
        data = _read_json(path, [])
        data.append({
            "timestamp": get_timestamp(),
            "operation": operation,
            "userId": user_id,
            "args": args_summary,
            "result": result or {},
        })
        _write_json(path, data)
    except Exception:
        # Do not interfere with the main operation
        pass


@router.get("/idea-missions", tags=["Missions"], summary="List idea missions")
async def list_idea_missions(userId: Optional[str] = Query(None)):
    """List idea missions, optionally filtered by userId"""
    async with store_lock:
        missions = _read_store()
    if userId:
        missions = [m for m in missions if m.get("userId") == userId]
    return create_success_response(missions, "Idea missions retrieved")


@router.get("/idea-missions/{mission_id}", tags=["Missions"], summary="Get a mission by id")
async def get_idea_mission(mission_id: str):
    async with store_lock:
        missions = _read_store()
    for m in missions:
        if m.get("id") == mission_id:
            return create_success_response(m, "Idea mission retrieved")
    raise HTTPException(status_code=404, detail="Idea mission not found")


@router.post("/idea-missions", tags=["Missions"], summary="Create a mission")
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


@router.patch("/idea-missions/{mission_id}", tags=["Missions"], summary="Update a mission")
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


@router.delete("/idea-missions/{mission_id}", tags=["Missions"], summary="Delete a mission")
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
    files: Optional[List[Dict[str, Any]]] = None  # [{id,name,prompt,url}]

@router.post("/idea-missions/{mission_id}/agents/planning/execute", tags=["Planning"], summary="Execute Planning agent")
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
        # Load mission-scoped planning prompt override if present
        planning_prompt = None
        try:
            presets = _read_json(_presets_path(mission_id), [])
            for p in presets:
                if p.get('agentType') == 'planning' or p.get('id') in ('preset_planning', 'planning'):
                    planning_prompt = p.get('systemPrompt') or None
                    break
        except Exception:
            planning_prompt = None

        # Include file prompts as lightweight context
        file_context = "\n".join([
            f"FILE: {f.get('name')}\nPROMPT: {f.get('prompt','')}\nURL: {f.get('url','')}"
            for f in (req.files or [])
        ])
        base_instruction = (
            "You are a Planning Agent. Brainstorm a structured plan for the user's idea. "
            "Provide a concise markdown plan with sections: Objectives, Assumptions, Approach, Milestones, Risks, Deliverables. "
            "If file prompts are provided, reflect them appropriately in the plan."
        )
        instruction = (planning_prompt or base_instruction).strip()

        # Prefer OpenAI Agents SDK + LiteLLM if available
        try:
            from agents import Agent as OAAgent, Runner  # type: ignore
            from agents.extensions.models.litellm_model import LitellmModel  # type: ignore

            # Allow env override; default to Ollama Qwen3:4b via LiteLLM's ollama provider
            litellm_model = os.getenv('PLANNING_LITELLM_MODEL', 'ollama/qwen3:4b')
            litellm_api_key = os.getenv('LITELLM_API_KEY', os.getenv('OPENAI_API_KEY', ''))

            # Compose single-turn input including history and files
            composed = (
                f"History (recent):\n{context_text}\n\n" 
                f"Files:\n{file_context}\n\n"
                f"Task:\n{req.message}"
            )
            oa_agent = OAAgent(
                name="Planning Agent",
                instructions=instruction,
                model=LitellmModel(model=litellm_model, api_key=litellm_api_key),
                tools=[],
            )
            # Runner is async; FastAPI handler is async as well
            result = await Runner.run(oa_agent, composed)
            answer = getattr(result, 'final_output', None) or str(result)
            mode = "agents_litellm"
        except Exception:
            # Fallback to deterministic mock plan
            answer = mock_plan(req.message, context_text)
            mode = "mock"
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

    # Activity log (non-blocking)
    _log_activity(mission_id, OP_PLANNING_EXECUTE, {"message": req.message}, user_id=req.userId, result={"assistantMessageId": assistant_message_id})

    return create_success_response({
        "executionId": execution_id,
        "messageId": assistant_message_id,
        "userMessageId": user_message_id,
        "agent": "planning",
        "answer": answer,
        "mode": mode,
        "usage": {},
        "operation": OP_PLANNING_EXECUTE,
        "chatUri": f"idea://{mission_id}/chat",
    }, "Planning agent completed")


# --- Literature Researcher execution ---
class ExecuteResearchRequest(BaseModel):
    userId: str
    topic: str
    criteria: Optional[str] = None
    years: Optional[int] = 5
    history: Optional[List[ChatHistoryItem]] = None
    files: Optional[List[Dict[str, Any]]] = None


@router.post("/idea-missions/{mission_id}/agents/research/execute", tags=["Research"], summary="Execute Literature Researcher")
async def execute_research_agent(mission_id: str, req: ExecuteResearchRequest):
    """Use OpenAI Agents SDK + LiteLLM (if available) to perform a literature scan plan and synthesis.
    Falls back to a deterministic mock if unavailable.
    """
    def mock_research(topic: str, criteria: Optional[str], years: int) -> str:
        return (
            f"## Literature Scan: {topic}\n\n"
            f"### Criteria\n{criteria or 'Peer-reviewed; last %d years; primary results; reproducibility notes' % years}\n\n"
            f"### Queries\n- arxiv: {topic} AND recent:%d\n- web: {topic} review survey\n\n" % years +
            "### Screening\n- [Placeholder] Title A — include (matches criteria).\n- [Placeholder] Title B — exclude (out of scope).\n\n"
            "### Evidence Table (sample)\n| citation | year | venue | method | dataset | metric | value |\n\n"
            "### Synthesis\n- Key trends...\n- Limitations...\n- Open problems...\n"
        )

    # Load mission-scoped research prompt override if present
    research_prompt = None
    try:
        presets = _read_json(_presets_path(mission_id), [])
        for p in presets:
            if p.get('agentType') == 'research' or p.get('id') in ('preset_research', 'research'):
                research_prompt = p.get('systemPrompt') or None
                break
    except Exception:
        research_prompt = None

    base_instruction = (
        "You are a Literature Researcher with access to tools (conceptually): arxiv_search, web_search, fetch_pdf, "
        "extract_pdf_text, summarize_text. Plan queries, screen results against criteria, and produce a concise synthesis. "
        "Return a short markdown report with sections: Criteria, Queries, Screening decisions, Evidence table (compact), Synthesis."
    )
    instruction = (research_prompt or base_instruction).strip()

    # Include brief context from history (optional)
    history = req.history or []
    context_lines = []
    for h in history[-6:]:
        role = (h.role or "user")[:6].upper()
        context_lines.append(f"{role}: {h.content}")
    context_text = "\n".join(context_lines)

    # Prefer Agents SDK + LiteLLM if installed
    mode = "mock"
    try:
        try:
            from agents import Agent as OAAgent, Runner  # type: ignore
            from agents.extensions.models.litellm_model import LitellmModel  # type: ignore
            litellm_model = os.getenv('RESEARCH_LITELLM_MODEL', os.getenv('PLANNING_LITELLM_MODEL', 'ollama/qwen3:4b'))
            litellm_api_key = os.getenv('LITELLM_API_KEY', os.getenv('OPENAI_API_KEY', ''))

            composed = (
                f"Context:\n{context_text}\n\n"
                f"Topic: {req.topic}\nYears: {req.years or 5}\nCriteria: {req.criteria or ''}\n"
            )
            oa_agent = OAAgent(
                name="Literature Researcher",
                instructions=instruction,
                model=LitellmModel(model=litellm_model, api_key=litellm_api_key),
                tools=[],
            )
            result = await Runner.run(oa_agent, composed)
            answer = getattr(result, 'final_output', None) or str(result)
            mode = "agents_litellm"
        except Exception:
            answer = mock_research(req.topic, req.criteria, req.years or 5)
            mode = "mock"
    except Exception:
        answer = mock_research(req.topic, req.criteria, req.years or 5)
        mode = "mock"

    # Persist to chat like other agents
    execution_id = generate_id("exec")
    assistant_message_id = generate_id("msg")
    user_message_id = generate_id("msg")

    chat_path = _chat_path(mission_id)
    chat = _read_json(chat_path, [])
    chat.append({
        "id": user_message_id,
        "role": "user",
        "content": f"[Research] {req.topic}",
        "timestamp": get_timestamp(),
    })
    chat.append({
        "id": assistant_message_id,
        "role": "assistant",
        "content": answer,
        "timestamp": get_timestamp(),
        "agentId": "research",
        "agentName": "Research Agent",
        "agentIcon": "brain",
        "metadata": {"mode": mode},
    })
    _write_json(chat_path, chat)

    _log_activity(mission_id, OP_RESEARCH_EXECUTE, {"topic": req.topic}, user_id=req.userId, result={"assistantMessageId": assistant_message_id})

    return create_success_response({
        "executionId": execution_id,
        "messageId": assistant_message_id,
        "userMessageId": user_message_id,
        "agent": "research",
        "answer": answer,
        "mode": mode,
        "operation": OP_RESEARCH_EXECUTE,
        "chatUri": f"idea://{mission_id}/chat",
    }, "Research agent completed")


# --- Semantic Search Agent (OpenAI Agents SDK + LiteLLM, tool = collection search) ---
class ExecuteSemanticRequest(BaseModel):
    userId: str
    groupId: str
    query: str
    limit: Optional[int] = 10


@router.post("/idea-missions/{mission_id}/agents/search/semantic/execute", tags=["Search"], summary="Execute Semantic Search agent")
async def execute_semantic_search_agent(mission_id: str, req: ExecuteSemanticRequest):
    """Semantic search over a document group via an agent with one tool.
    Returns a compact list of paper ids and abstracts.
    """
    import json as _json
from urllib.parse import urlencode
import urllib.request as _urlreq
from core.agents.search_semantic import SemanticSearchAgent
from core.agents.base import find_agent_preset

    def direct_search(group_id: str, query: str, limit: int) -> list:
        base = os.getenv('API_INTERNAL_BASE', '').rstrip('/') or f"http://localhost:{os.getenv('PORT','8000')}"
        path = f"/api/v1/document-groups/{group_id}/search?" + urlencode({"query": query, "limit": str(limit)})
        url = base + path
        with _urlreq.urlopen(url) as resp:  # type: ignore
            data = _json.loads(resp.read().decode('utf-8'))
        items = data.get('data', {}).get('results', []) if isinstance(data, dict) else []
        results = []
        for it in items:
            results.append({
                "id": it.get('id'),
                "title": it.get('title'),
                "abstract": it.get('abstract'),
                "metadata": {
                    "authors": it.get('authors'),
                    "publication_date": it.get('publication_date'),
                    "url": it.get('url'),
                    "relevance_score": it.get('relevance_score'),
                }
            })
        return results

    results: list
    mode = "mock"
    try:
        try:
            # Load mission-scoped preset for semantic
            preset = find_agent_preset(_read_json(_presets_path(mission_id), []), 'semantic')
            system_prompt = preset.get('systemPrompt') if isinstance(preset, dict) else None
            agent = SemanticSearchAgent(direct_search)
            out = await agent.run(group_id=req.groupId, query=req.query, limit=req.limit or 10, system_prompt=system_prompt)
            mode = out.get('mode', 'agents_litellm')
            results = out.get('results', [])
        except Exception:
            results = direct_search(req.groupId, req.query, req.limit or 10)
            mode = "direct"
    except Exception:
        results = []
        mode = "error"

    # Persist chat record (assistant summary as markdown with top N titles)
    execution_id = generate_id("exec")
    assistant_message_id = generate_id("msg")
    user_message_id = generate_id("msg")

    chat_path = _chat_path(mission_id)
    chat = _read_json(chat_path, [])
    chat.append({"id": user_message_id, "role": "user", "content": f"[Semantic Search] {req.query}", "timestamp": get_timestamp()})
    # Build markdown summary
    lines = ["### Semantic Search Results", ""]
    for i, it in enumerate(results[:10]):
        title = it.get('title') or 'Untitled'
        lines.append(f"{i+1}. {title}")
    chat.append({
        "id": assistant_message_id,
        "role": "assistant",
        "content": "\n".join(lines),
        "timestamp": get_timestamp(),
        "agentId": "semantic",
        "agentName": "Semantic Search",
        "agentIcon": "search",
        "metadata": {"mode": mode, "count": len(results)},
    })
    _write_json(chat_path, chat)

    _log_activity(mission_id, OP_SEARCH_SEMANTIC_EXECUTE, {"query": req.query, "groupId": req.groupId}, user_id=req.userId, result={"count": len(results)})

    return create_success_response({
        "executionId": execution_id,
        "messageId": assistant_message_id,
        "userMessageId": user_message_id,
        "agent": "semantic",
        "mode": mode,
        "results": results,
        "operation": OP_SEARCH_SEMANTIC_EXECUTE,
    }, "Semantic search completed")


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

@router.post("/idea-missions/{mission_id}/messages/{message_id}/save", tags=["Artifacts"], summary="Save assistant message as artifact")
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

        # Activity log
        _log_activity(mission_id, OP_ARTIFACT_SAVE, {"messageId": message_id, "hint": req.filenameHint}, user_id=req.userId, result={"artifactId": artifact_id})

        return create_success_response({
            "artifact": {
                **record,
                "downloadUrl": f"/api/v1/idea-missions/{mission_id}/files/{artifact_id}",
                "uri": f"idea://{mission_id}/artifact/{artifact_id}",
            }
        }, "Artifact saved")
    except Exception as e:
        # Preserve explicit HTTP errors; wrap only unexpected ones
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to save artifact: {str(e)}")


@router.get("/idea-missions/{mission_id}/artifacts", tags=["Artifacts"], summary="List artifacts")
async def list_artifacts(mission_id: str):
    manifest = _read_json(_manifest_path(mission_id), [])
    # Ensure downloadUrl is present for each artifact (older manifests may not have it)
    enriched = []
    for rec in manifest:
        rec = {**rec}
        if not rec.get("downloadUrl"):
            rec["downloadUrl"] = f"/api/v1/idea-missions/{mission_id}/files/{rec.get('id')}"
        if not rec.get("uri"):
            rec["uri"] = f"idea://{mission_id}/artifact/{rec.get('id')}"
        enriched.append(rec)
    return create_success_response(enriched, "Artifacts listed")


class UpdateArtifactRequest(BaseModel):
    name: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    content: Optional[str] = None

@router.patch("/idea-missions/{mission_id}/artifacts/{artifact_id}", tags=["Artifacts"], summary="Update artifact (rename/content/metadata)")
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
                    _log_activity(mission_id, OP_ARTIFACT_RENAME, {"artifactId": artifact_id, "newName": new_name})
                except Exception as e:
                    raise HTTPException(status_code=500, detail=f"Rename failed: {str(e)}")
            # Update content if provided
            if req.content is not None:
                path = _mission_dir(mission_id) / rec.get('path')
                try:
                    tmp = path.with_suffix(path.suffix + '.tmp')
                    tmp.write_text(req.content, encoding='utf-8')
                    tmp.replace(path)
                    rec['size'] = len(req.content.encode('utf-8'))
                    rec['updatedAt'] = get_timestamp()
                    _log_activity(mission_id, OP_ARTIFACT_UPDATE_CONTENT, {"artifactId": artifact_id, "bytes": rec['size']})
                except Exception as e:
                    raise HTTPException(status_code=500, detail=f"Content update failed: {str(e)}")
            _write_json(manifest_path, manifest)
            # Enrich response with URIs
            response_rec = {**rec, "downloadUrl": f"/api/v1/idea-missions/{mission_id}/files/{artifact_id}", "uri": f"idea://{mission_id}/artifact/{artifact_id}"}
            return create_success_response(response_rec, "Artifact updated")
    raise HTTPException(status_code=404, detail='Artifact not found')


@router.delete("/idea-missions/{mission_id}/artifacts/{artifact_id}", tags=["Artifacts"], summary="Delete artifact")
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
    _log_activity(mission_id, OP_ARTIFACT_DELETE, {"artifactId": artifact_id})
    return create_success_response({"id": artifact_id}, "Artifact deleted")


@router.get("/idea-missions/{mission_id}/files/{file_id}", tags=["Artifacts"], summary="Download artifact file")
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


# --- File contexts (selection + prompts) ---
class FileContextItem(BaseModel):
    id: str
    name: str
    prompt: Optional[str] = None
    selected: bool = False

class AgentPreset(BaseModel):
    id: str
    name: str
    agentType: str
    icon: Optional[str] = None
    temperature: Optional[float] = 0.7
    systemPrompt: Optional[str] = None
    styleLevel: Optional[int] = 50

@router.get("/idea-missions/{mission_id}/file-context", tags=["FileContext"], summary="Get file selection + prompts")
async def get_file_context(mission_id: str):
    data = _read_json(_file_context_path(mission_id), [])
    return create_success_response(data, "File context")

@router.put("/idea-missions/{mission_id}/file-context", tags=["FileContext"], summary="Save file selection + prompts")
async def put_file_context(mission_id: str, items: List[FileContextItem]):
    _write_json(_file_context_path(mission_id), [i.dict() for i in items])
    return create_success_response({"count": len(items), "operation": OP_FILE_CONTEXT_PUT}, "File context saved")


# --- Mission-scoped Agent Presets ---
@router.get("/idea-missions/{mission_id}/agents/presets", tags=["Agents"], summary="List mission agent presets")
async def list_agent_presets(mission_id: str):
    data = _read_json(_presets_path(mission_id), [])
    return create_success_response(data, "Presets")

@router.post("/idea-missions/{mission_id}/agents/presets", tags=["Agents"], summary="Create or replace a mission agent preset")
async def create_agent_preset(mission_id: str, preset: AgentPreset):
    presets = _read_json(_presets_path(mission_id), [])
    presets = [p for p in presets if p.get('id') != preset.id]
    presets.append(preset.model_dump())
    _write_json(_presets_path(mission_id), presets)
    return create_success_response(presets, "Preset saved")

@router.delete("/idea-missions/{mission_id}/agents/presets/{preset_id}", tags=["Agents"], summary="Delete a mission agent preset")
async def delete_agent_preset(mission_id: str, preset_id: str):
    presets = _read_json(_presets_path(mission_id), [])
    new_list = [p for p in presets if p.get('id') != preset_id]
    _write_json(_presets_path(mission_id), new_list)
    return create_success_response({"id": preset_id}, "Preset removed")

class ReorderRequest(BaseModel):
    order: List[str]

@router.put("/idea-missions/{mission_id}/agents/presets/order", tags=["Agents"], summary="Reorder mission agent presets")
async def reorder_agent_presets(mission_id: str, body: ReorderRequest):
    presets = _read_json(_presets_path(mission_id), [])
    id_to_preset = {p.get('id'): p for p in presets}
    new_list = [id_to_preset[i] for i in body.order if i in id_to_preset]
    # Append any missing (safety)
    for p in presets:
        if p.get('id') not in body.order:
            new_list.append(p)
    _write_json(_presets_path(mission_id), new_list)
    return create_success_response({"count": len(new_list)}, "Order updated")


# --- Add external text file ---
class AddTextArtifactRequest(BaseModel):
    userId: str
    name: str  # filename without extension ok
    content: str
    format: Optional[str] = "markdown"  # markdown|text|json
    metadata: Optional[Dict[str, Any]] = None

@router.post("/idea-missions/{mission_id}/artifacts/text", tags=["Artifacts"], summary="Add external text artifact")
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

        _log_activity(mission_id, OP_ARTIFACT_SAVE, {"name": req.name, "format": req.format}, user_id=req.userId, result={"artifactId": artifact_id})
        return create_success_response({ "artifact": { **record, "downloadUrl": f"/api/v1/idea-missions/{mission_id}/files/{artifact_id}", "uri": f"idea://{mission_id}/artifact/{artifact_id}" } }, "Artifact added")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add artifact: {str(e)}")


# --- Chat history ---
@router.get("/idea-missions/{mission_id}/chat", tags=["Chat"], summary="Get chat history")
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

@router.post("/idea-missions/{mission_id}/chat", tags=["Chat"], summary="Append a chat message")
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
    # Activity log (non-blocking)
    _log_activity(mission_id, OP_CHAT_APPEND, {"role": req.role})
    # Return a response copy enriched with operation; avoid mutating persisted record
    response_rec = {**record, "operation": OP_CHAT_APPEND}
    return create_success_response(response_rec, "Message appended")


