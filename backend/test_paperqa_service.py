import asyncio
from types import SimpleNamespace
from pathlib import Path
from typing import Any, Dict

import pytest


paperqa_service_mod = pytest.importorskip(
    "core.services.paperqa_service",
    reason="PaperQAService module not available",
)


@pytest.mark.asyncio
async def test_query_documents_collection_not_found(monkeypatch: pytest.MonkeyPatch):
    service = paperqa_service_mod.PaperQAService()

    # Make collections_manager return None
    class FakeManager:
        def get_collection(self, name: str):
            return None

    monkeypatch.setattr(paperqa_service_mod, "collections_manager", FakeManager(), raising=True)

    result: Dict[str, Any] = await service.query_documents("unknown_collection", "What is it?")
    assert result["error"]
    assert "not found" in result["error"].lower()


@pytest.mark.asyncio
async def test_query_documents_cache_missing(monkeypatch: pytest.MonkeyPatch):
    service = paperqa_service_mod.PaperQAService()

    # Fake collection returned
    class FakeCollection:
        def __init__(self, name: str):
            self.name = name

    class FakeManager:
        def get_collection(self, name: str):
            return FakeCollection(name)

    monkeypatch.setattr(paperqa_service_mod, "collections_manager", FakeManager(), raising=True)

    # Make the expected cache path not exist
    original_exists = Path.exists

    def fake_exists(self: Path) -> bool:  # type: ignore[override]
        if str(self).endswith("paperqa_cache.pkl"):
            return False
        return original_exists(self)

    monkeypatch.setattr(Path, "exists", fake_exists, raising=False)

    result: Dict[str, Any] = await service.query_documents("some_collection", "What is it?")
    assert result["error"]
    assert "cache file not found" in result["error"].lower()


@pytest.mark.asyncio
async def test_query_documents_success_with_link_replacement(monkeypatch: pytest.MonkeyPatch):
    service = paperqa_service_mod.PaperQAService()

    # Fake collection returned
    class FakeCollection:
        def __init__(self, name: str):
            self.name = name

    class FakeManager:
        def get_collection(self, name: str):
            return FakeCollection(name)

    monkeypatch.setattr(paperqa_service_mod, "collections_manager", FakeManager(), raising=True)

    # Ensure cache path exists check passes
    original_exists = Path.exists

    def fake_exists(self: Path) -> bool:  # type: ignore[override]
        if str(self).endswith("paperqa_cache.pkl"):
            return True
        return original_exists(self)

    monkeypatch.setattr(Path, "exists", fake_exists, raising=False)

    # Fake Docs object returned by pickle.load, with aquery coroutine
    class FakeResponse:
        def __init__(self):
            # Include a question line and a citation to be linkified
            self.formatted_answer = (
                "Question: What are recent advances in tool-use agents?\n"
                "Recent work builds upon (Some Author et al., 2021) to demonstrate progress."
            )
            self.context = [
                {"doc_id": "1", "title": "Tool-Use Agents", "year": 2021},
            ]

    class FakeDocObj:
        def __init__(self, citation: str):
            self.citation = citation

    class FakeTextObj:
        def __init__(self, citation: str):
            self.doc = FakeDocObj(citation)

    class FakeDocs:
        def __init__(self):
            # This citation will produce an arXiv link
            self.texts = [FakeTextObj("Some Author, arXiv:2101.12345, 2021")]
            self.docs = [1] * 10

        async def aquery(self, question: str, settings=None):  # noqa: ANN001
            return FakeResponse()

    def fake_pickle_load(file_obj):  # noqa: ANN001
        return FakeDocs()

    import pickle

    monkeypatch.setattr(pickle, "load", fake_pickle_load, raising=True)

    result: Dict[str, Any] = await service.query_documents(
        "LLM_Reasoning_Agents", "What are recent advances in tool-use agents?"
    )

    assert not result["error"]
    # Question line should be stripped
    assert "Question:" not in result["answer_text"]
    # Citation should be replaced with markdown link to arXiv
    assert "[" in result["answer_text"] and "](" in result["answer_text"]
    # Context propagated
    assert isinstance(result.get("context"), list) and result["context"]


