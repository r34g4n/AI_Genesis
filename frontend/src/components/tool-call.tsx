import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CatchAllActionRenderProps } from "@copilotkit/react-core";
import { Loader2, CheckCircle2, HelpCircle, Search, Globe, Wrench, Database, Code, BrainCircuit, Route } from "lucide-react";

export function ToolCall(toolCallProps: CatchAllActionRenderProps) {
  const triggerStyles = "inline-flex rounded-xl items-center gap-2 p-2 bg-indigo-500/60 text-white cursor-pointer m-1 transition-all hover:bg-indigo-500/80";
  const contentStyles = "bg-white rounded-xl min-w-[300px] max-w-[500px] p-4 border shadow-md";
  
  // Get status-specific styles
  const getStatusStyles = (status: string) => {
    const baseStyles = "text-xs px-2 py-1 rounded-full flex items-center justify-center min-w-[24px] min-h-[24px] ml-1 transition-colors";
    
    switch(status) {
      case "inProgress":
      case "executing":
        return `${baseStyles} bg-blue-500 text-white shadow-sm`;
      case "complete":
        return `${baseStyles} bg-emerald-500 text-white shadow-sm`;
      default:
        return `${baseStyles} bg-gray-400 text-white shadow-sm`;
    }
  };
  
  const statusStyles = getStatusStyles(toolCallProps.status);

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={triggerStyles}>
            <span className="pr-2">
              {/* Tool-specific icons */}
              {toolCallProps.name === "web_research" && <Globe className="h-4 w-4" />}
              {toolCallProps.name === "search_web" && <Search className="h-4 w-4" />}
              {toolCallProps.name === "update_learning_plan_canvas" && <Route className="h-4 w-4" />}
              {toolCallProps.name.includes("database") && <Database className="h-4 w-4" />}
              {toolCallProps.name.includes("code") && <Code className="h-4 w-4" />}
              {toolCallProps.name.includes("ai") && <BrainCircuit className="h-4 w-4" />}
              {/* Default icon for other tools */}
              {!["web_research", "search_web", "update_learning_plan_canvas"].includes(toolCallProps.name) && 
               !toolCallProps.name.includes("database") && 
               !toolCallProps.name.includes("code") && 
               !toolCallProps.name.includes("ai") && 
               <Wrench className="h-4 w-4" />}
            </span>
            {/* Show friendly descriptive text with appropriate tense based on status */}
            <span className="text-sm font-medium">
              {/* Web research tool */}
              {toolCallProps.name === "web_research" && (
                toolCallProps.status === "complete" ? "Web Search Complete" :
                (toolCallProps.status === "inProgress" || toolCallProps.status === "executing") ? "Searching Web" : 
                "Web Search"
              )}
              
              {/* Search web tool */}
              {toolCallProps.name === "search_web" && (
                toolCallProps.status === "complete" ? "Search Complete" :
                (toolCallProps.status === "inProgress" || toolCallProps.status === "executing") ? "Searching Web" : 
                "Web Search"
              )}
              
              {/* Learning canvas tool */}
              {toolCallProps.name === "update_learning_plan_canvas" && (
                toolCallProps.status === "complete" ? "Canvas Updated" :
                (toolCallProps.status === "inProgress" || toolCallProps.status === "executing") ? "Updating Canvas" : 
                "Update Canvas"
              )}
              
              {/* All other tools - show original name */}
              {!['web_research', 'search_web', 'update_learning_plan_canvas'].includes(toolCallProps.name) && (
                toolCallProps.name
              )}
            </span>
            <span className={statusStyles}>
              {toolCallProps.status === "inProgress" && <Loader2 className="h-4 w-4 animate-spin" />}
              {toolCallProps.status === "executing" && <CheckCircle2 className="h-4 w-4" />}
              {toolCallProps.status === "complete" && <CheckCircle2 className="h-4 w-4" />}
              {!['inProgress', 'executing', 'complete'].includes(toolCallProps.status) && <HelpCircle className="h-4 w-4" />}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="right" 
          align="center" 
          className={contentStyles}
        >
          <ToolCallInformation {...toolCallProps} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

const ToolCallInformation = (toolCallProps: CatchAllActionRenderProps) => {
  const { name, args, status, result } = toolCallProps;

  const wrapperStyles = "flex flex-col gap-2 max-h-[400px] overflow-y-auto text-black";
  const titleStyles = "flex flex-col gap-1";
  const contentStyles = "flex flex-col gap-1";
  const preStyles = "bg-indigo-500/10 p-2 rounded text-sm overflow-auto max-h-[200px] m-0 whitespace-pre-wrap break-words";

  return (
    <div className={wrapperStyles}>
      <div className={titleStyles}>
        <strong>Name:</strong> {name}
      </div>
      <div className={contentStyles}>
        <strong>Arguments:</strong> 
        <pre className={preStyles}>
          {JSON.stringify(args, null, 2)}
        </pre>
      </div>
      <div className={contentStyles}>
        <strong>Status:</strong> {status}
      </div>
      <div className={contentStyles}>
        <strong>Result:</strong> 
        <pre className={preStyles}>
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  );
}