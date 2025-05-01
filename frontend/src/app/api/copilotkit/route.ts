/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest } from "next/server";
import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  ExperimentalEmptyAdapter,
  langGraphPlatformEndpoint,
} from "@copilotkit/runtime";

const serviceAdapter = new ExperimentalEmptyAdapter();

/*const runtime = new CopilotRuntime({
  remoteEndpoints: [
    langGraphPlatformEndpoint({
      deploymentUrl: process.env.LANGGRAPH_DEPLOYMENT_URL || "",
      langsmithApiKey: process.env.LANGSMITH_API_KEY || "", // only used in LangGraph Platform deployments
      agents: [{
          name: process.env.NEXT_PUBLIC_COPILOTKIT_AGENT_NAME || "",
          description: process.env.NEXT_PUBLIC_COPILOTKIT_AGENT_DESCRIPTION || 'A helpful LLM agent.'
      }]
    }),
  
],
});*/

const runtime = new CopilotRuntime({
  remoteEndpoints: [
    // Our FastAPI endpoint URL
    // { url: "http://localhost:2024/copilotkit" },
    { url: `${process.env.LANGGRAPH_DEPLOYMENT_URL|| "http://localhost:2024"}/copilotkit` },
  ],
});

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
