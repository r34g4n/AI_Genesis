from contextlib import asynccontextmanager

import uvicorn
from copilotkit import CopilotKitRemoteEndpoint, LangGraphAgent
from copilotkit.integrations.fastapi import add_fastapi_endpoint
from fastapi import FastAPI
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

from app.graph import make_graph
from app.settings import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with AsyncPostgresSaver.from_conn_string(str(settings.database_uri)) as checkpointer:
        # NOTE: you need to call .setup() the first time you're using your checkpointer
        await checkpointer.setup()
        # Create an async graph
        workflow = await make_graph()
        update = {"checkpointer": checkpointer, "store": None}
        graph = workflow.copy(update=update)

        # Create SDK with the graph
        sdk = CopilotKitRemoteEndpoint(
            agents=[
                LangGraphAgent(
                    name="agent",
                    description="A helpful LLM agent.",
                    graph=graph,
                ),
            ],
        )

        # Add the CopilotKit FastAPI endpoint
        add_fastapi_endpoint(app, sdk, "/copilotkit")
        yield


app = FastAPI(lifespan=lifespan)


@app.get("/health")
def health():
    """Health check."""
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", reload=True,port=2024)
