import asyncio
from typing import Annotated

from langchain_core.messages import ToolMessage
from langchain_core.tools import tool
from langchain_core.tools.base import InjectedToolCallId
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.prebuilt import InjectedState
from langgraph.types import Command
from tavily import AsyncTavilyClient
from trustcall import create_extractor

from app.configuration import State
from app.prompts import LEARNING_PLANNER
from app.schema import LearningPlan
from app.utils import deduplicate_sources, format_sources, merge_search_results

# Search

tavily_async_client = AsyncTavilyClient()

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-preview-04-17",
    temperature=0.7,
    max_retries=5,
)


@tool
async def update_learning_plan_canvas(
    tool_call_id: Annotated[str, InjectedToolCallId],
    state: Annotated[State, InjectedState],
    content: str,
):
    """
    Call this tool when you need to update the learning plan canvas.

    Args:
        content: learning plan or updated instructions
    """

    # bound = llm.with_structured_output(LearningPlan)
    bound = create_extractor(llm, tools=[LearningPlan])

    response = await bound.ainvoke([("system", LEARNING_PLANNER), ("user", content)])
    data = response["responses"][0] if response["responses"] else response

    return Command(
        update={
            # update the state keys
            "learning_plan": data,
            # update the message history
            "messages": [
                ToolMessage(
                    "learning canvas successfully updated, no need to echo the same plan to user!",
                    tool_call_id=tool_call_id,
                )
            ],
        }
    )


@tool
async def web_research(
    tool_call_id: Annotated[str, InjectedToolCallId],
    state: Annotated[State, InjectedState],
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
    search_results = merge_search_results(state.search_results, search_docs)

    return Command(
        update={
            # update the state keys
            "search_results": search_results,
            # update the message history
            "messages": [
                ToolMessage(
                    source_str,
                    tool_call_id=tool_call_id,
                )
            ],
        }
    )
