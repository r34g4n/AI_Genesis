import "@copilotkit/react-ui/styles.css";
import React, { ReactNode } from "react";
import { CopilotKit } from "@copilotkit/react-core";

// When using Copilot Cloud, all we need is the publicApiKey.
const publicApiKey = process.env.NEXT_PUBLIC_COPILOT_API_KEY;
// The name of the agent that we'll be using.
const agentName = process.env.NEXT_PUBLIC_COPILOTKIT_AGENT_NAME

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <CopilotKit 
      runtimeUrl="/api/copilotkit"
      publicApiKey={publicApiKey}
      agent={agentName}
    >
      {children}
    </CopilotKit>
  );
}
