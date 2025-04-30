"""Define the configurable parameters & state for the agent."""

from __future__ import annotations

import os
from dataclasses import dataclass, fields
from typing import Annotated, Any, Optional

from langchain_core.messages import AnyMessage
from langchain_core.runnables import RunnableConfig
from langgraph.graph.message import add_messages

from app.schema import LearningPlan
from app.utils import merge_search_results


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


@dataclass
class State:
    messages: Annotated[list[AnyMessage], add_messages]
    learning_plan: Annotated[LearningPlan | None, lambda left, right: left if right is None else right] = None
    search_results: list[dict] | None = None
