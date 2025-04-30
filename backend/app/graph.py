from typing import Dict, List, Literal, cast

from langchain.chat_models import init_chat_model
from langchain_core.messages import AIMessage
from langchain_core.runnables import RunnableConfig
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END
from langgraph.graph.message import StateGraph
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.pregel import RetryPolicy

from app import tools
from app.configuration import Configuration, State
from app.prompts import LEARNING_RESEARCHER

model = init_chat_model("google_genai:gemini-2.5-flash-preview-04-17", temperature=0.5, max_retries=2)
_tools = [
    tools.read_learning_plan_canvas,
    tools.update_learning_plan_canvas,
    tools.web_research,
]

checkpointer = MemorySaver()


async def make_graph(config: RunnableConfig):
    async def call_model(state: State, config: RunnableConfig) -> Dict[str, List[AIMessage]]:
        bound = model.bind_tools(_tools)
        while True:
            messages = [("system", LEARNING_RESEARCHER), *state.messages]
            response = cast(AIMessage, await bound.ainvoke(messages))
            if not response.tool_calls and (
                not response.content or isinstance(response.content, list) and not response.content[0].get("text")
            ):
                # Create a new State object with updated messages
                new_messages = state.messages + [("user", "Respond with a real output.")]
                state = State(messages=new_messages, learning_plan=state.learning_plan, search_results=state.search_results)
            else:
                break
        return {"messages": [response]}

    def should_continue(state: State, config: RunnableConfig) -> Literal["tools", END]:
        next_node = tools_condition(state)
        if next_node == END:
            return END
        return "tools"

    tools_node = ToolNode(_tools, handle_tool_errors=True)
    builder = StateGraph(State, input=State, output=State, config_schema=Configuration)

    # add nodes
    builder.add_node("agent", call_model, retry=RetryPolicy(max_attempts=3))
    builder.add_node("tools", tools_node)

    # set entrypoint
    builder.set_entry_point("agent")

    # add edges

    builder.add_conditional_edges(
        "agent",
        should_continue,
    )

    # after tools call model
    builder.add_edge("tools", "agent")

    graph = builder.compile()
    graph.name = "AIGenesisAgent"
    return graph
