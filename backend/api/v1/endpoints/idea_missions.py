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


