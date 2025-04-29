"""Define the configurable parameters & state for the agent."""

from __future__ import annotations

import os
from dataclasses import dataclass, fields
from typing import Annotated, Any, Optional

from langchain_core.runnables import RunnableConfig
from langgraph.graph.message import MessagesState
from schema import LearningPlan


@dataclass(kw_only=True)
class Configuration:
    """Main configuration class for the memory graph system."""

    user_id: str = "default"
    """The ID of the user to remember in the conversation."""

    @classmethod
    def from_runnable_config(cls, config: Optional[RunnableConfig] = None) -> "Configuration":
        """Create a Configuration instance from a RunnableConfig."""
        configurable = config["configurable"] if config and "configurable" in config else {}
        values: dict[str, Any] = {f.name: os.environ.get(f.name.upper(), configurable.get(f.name)) for f in fields(cls) if f.init}

        return cls(**{k: v for k, v in values.items() if v})


def merge_search_results(left: list[dict] | dict | None, right: list[dict] | dict | None) -> list[dict]:
    if not isinstance(left, list):
        left = [left]
    if not isinstance(right, list):
        right = [right]
    return (left or []).extend(right or [])


class State(MessagesState):
    learning_plan: Annotated[LearningPlan | None, lambda left, right: left if right is None else right]
    search_results: Annotated[list[dict] | None, lambda left, right: merge_search_results(left, right)]
