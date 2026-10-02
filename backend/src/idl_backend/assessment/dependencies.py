from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from typing import Any


@dataclass(frozen=True)
class LangChainParts:
    PromptTemplate: Any
    PydanticOutputParser: Any
    BaseModel: Any
    Field: Any


@lru_cache(maxsize=1)
def load_parts() -> LangChainParts:
    try:
        from langchain_core.output_parsers import PydanticOutputParser
        from langchain_core.prompts import PromptTemplate
        from pydantic import BaseModel, Field
    except ImportError as exc:
        raise RuntimeError(
            "Missing LangChain dependencies. Run: python -m pip install langchain-core pydantic"
        ) from exc

    return LangChainParts(
        PromptTemplate=PromptTemplate,
        PydanticOutputParser=PydanticOutputParser,
        BaseModel=BaseModel,
        Field=Field,
    )


def dependency_status() -> dict[str, bool]:
    try:
        import langchain_core  # noqa: F401

        langchain_ok = True
    except Exception:
        langchain_ok = False

    try:
        import pydantic  # noqa: F401

        pydantic_ok = True
    except Exception:
        pydantic_ok = False

    return {"langchain_core": langchain_ok, "pydantic": pydantic_ok}
