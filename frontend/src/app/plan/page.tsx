"use client";

import { CatchAllActionRenderProps, useCoAgent, useCopilotAction, useLangGraphInterrupt } from "@copilotkit/react-core";
import { CopilotChat, CopilotKitCSSProperties } from "@copilotkit/react-ui";
import { ToolCall } from "@/components/tool-call";
import { AgentState } from "@/components/agent-state";
import { Interrupt } from "@/components/interrupt";
import { HTMLAttributes, useState, useEffect } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export default function Page() {
  const { state, setState, running } = useCoAgent({
    name: process.env.NEXT_PUBLIC_COPILOTKIT_AGENT_NAME || "",
  });
  const [sidebarSize, setSidebarSize] = useState(30); // Default sidebar size 30%
  
  // Save sidebar size preference to localStorage
  useEffect(() => {
    const savedSize = localStorage.getItem('learningCanvasSidebarSize');
    if (savedSize) {
      setSidebarSize(parseInt(savedSize));
    }
  }, []);
  
  const handleResizeEnd = (sizes: number[]) => {
    if (sizes[1]) {
      setSidebarSize(sizes[1]);
      localStorage.setItem('learningCanvasSidebarSize', sizes[1].toString());
    }
  };

  return (
    <main className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {running ? (
        <ResizablePanelGroup direction="horizontal" onLayout={handleResizeEnd} className="h-full">
          <ResizablePanel defaultSize={100 - sidebarSize} minSize={40}>
            <Chat
              className="h-full"
              style={{
                "--copilot-kit-primary-color": "rgba(30, 41, 59, 0.9)",
              } as CopilotKitCSSProperties}
            />
          </ResizablePanel>
          
          <ResizableHandle withHandle className="bg-slate-200 dark:bg-slate-800" />
          
          <ResizablePanel defaultSize={sidebarSize} minSize={20}>
            <AgentState state={state} setState={setState} className="h-full overflow-y-auto" />
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="w-1/2">
            <Chat
              className="rounded-lg shadow-lg"
              style={{
                "--copilot-kit-primary-color": "rgba(30, 41, 59, 0.9)",
              } as CopilotKitCSSProperties}
            />
          </div>
        </div>
      )}
    </main>
  );
}

function Chat(props: HTMLAttributes<HTMLDivElement>) {
  const { running } = useCoAgent({
    name: process.env.NEXT_PUBLIC_COPILOTKIT_AGENT_NAME || "",
  });

  useLangGraphInterrupt({
    render: ({ event, result, resolve }) => 
      <Interrupt event={event} result={result} resolve={resolve} />
  });

  useCopilotAction({
    name: "*",
    render: ({ name, args, status, result }: CatchAllActionRenderProps) => {      
      return (
        <ToolCall name={name} args={args} status={status} result={result} />
      );
    },
  });

  return (
    <div {...props}>
      <CopilotChat
        onThumbsDown={() => { alert("Thumbs down"); }}
        onThumbsUp={() => { alert("Thumbs up"); }}
        className={running ? "h-full py-6" : "h-full py-6 rounded-lg shadow-lg"}
        labels={{
          initial: "Hi! What would you like to learn today?",
          placeholder: "Type your message...",
        }}
      />
    </div>
  );
}
