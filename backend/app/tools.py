import asyncio
from typing import Annotated

from langchain_core.messages import ToolMessage
from langchain_core.runnables import RunnableConfig
from langchain_core.tools import tool
from langchain_core.tools.base import InjectedToolCallId
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.prebuilt import InjectedState, InjectedStore
from langgraph.store.base import BaseStore
from langgraph.types import Command
from tavily import AsyncTavilyClient

from app.configuration import State
from app.prompts import LEARNING_PLANNER
from app.schema import LearningPlan
from app.utils import deduplicate_sources, format_sources

# Search

tavily_async_client = AsyncTavilyClient()


@tool
async def update_learning_plan_canvas(
    tool_call_id: Annotated[str, InjectedToolCallId],
    config: RunnableConfig,
    store: Annotated[BaseStore, InjectedStore],
    state: Annotated[State, InjectedState],
    content: str,
):
    """
    Call this tool when you need to update the learning plan canvas.

    Args:
        content: learning plan or updated instructions
    """

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        temperature=0.5,
        max_retries=2,
    )
    bound = llm.with_structured_output(LearningPlan)

    system_message = LEARNING_PLANNER.format(plan=state.learning_plan.model_dump() if state.learning_plan else None)
    response = await bound.ainvoke(("system", system_message), ("user", content))
    return Command(
        update={
            # update the state keys
            "learning_plan": response,
            # update the message history
            "messages": [
                ToolMessage(
                    {"plan": response.model_dump(mode="json"), "message": "learning plan canvas has also been successfully updated!"},
                    tool_call_id=tool_call_id,
                )
            ],
        }
    )


@tool
async def web_research(
    tool_call_id: Annotated[str, InjectedToolCallId],
    queries: list[str],
):
    """
    Executes concurrent web through a search engine optimized for comprehensive, accurate, and trusted results. Useful for when you need to answer questions about current events. It not only retrieves URLs and snippets, but offers advanced search depths, domain management, time range filters, and image search, this tool delivers real-time, accurate, and citation-backed results.

    Args:
        queries: List of queries to look up
    """

    search_tasks = []
    for q in queries:
        search_tasks.append(
            tavily_async_client.search(
                q,
                include_raw_content=True,
                topic="general",
            )
        )

    # Execute all searches concurrently
    search_docs = await asyncio.gather(*search_tasks)
    # Deduplicate and format sources
    deduplicated_search_docs = deduplicate_sources(search_docs)
    source_str = format_sources(deduplicated_search_docs, max_tokens_per_source=1000, include_raw_content=True)

    return Command(
        update={
            # update the state keys
            "search_results": search_docs,
            # update the message history
            "messages": [
                ToolMessage(
                    source_str,
                    tool_call_id=tool_call_id,
                )
            ],
        }
    )
