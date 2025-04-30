import React from 'react';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ExternalLink, ChevronDown, ChevronRight, Youtube, Globe, Calendar, Book, CheckCircle2, Search, Download, FileDown } from "lucide-react";

// Define types that match the backend schema
export type Activity = {
  description: string;
  frequency: string;
};

export type Resource = {
  name: string;
  title?: string; // For backward compatibility
  type: 'app' | 'podcast' | 'book' | 'documentation' | 'other';
  url?: string;
};

export type WeekPlan = {
  week_number: number;
  focus: string;
  activities: Activity[];
  resources: Resource[];
  checkpoint: string;
};

export type LearningPlan = {
  topic: string;
  duration_weeks: number;
  weekly_plans: WeekPlan[];
};

export type SearchResultItem = {
  title?: string;
  url?: string;
  score?: number;
  content?: string;
  raw_content?: string;
};

export type SearchResult = {
  query?: string;
  answer?: string | null;
  follow_up_questions?: string | null;
  images?: string[] | unknown[];
  response_time?: number;
  results?: SearchResultItem[];
};

export type AgentState = {
  learning_plan?: LearningPlan | null;
  search_results?: SearchResult[] | null;
  [key: string]: unknown;
};

export type AgentStateProps = {
  state: AgentState;
  setState?: (state: AgentState) => void;
  className?: string;
};

// For backward compatibility
export type State = AgentState;

export function AgentState({ state, setState, className }: AgentStateProps) {
  const { messages, ...rest } = state;
  const [activeWeek, setActiveWeek] = React.useState<number | null>(null);
  const [editableState, setEditableState] = React.useState(JSON.stringify(rest, null, 2));
  const [isEditing, setIsEditing] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);

  // Update editable state when the actual state changes (if not currently editing)
  React.useEffect(() => {
    if (!isEditing) {
      setEditableState(JSON.stringify(rest, null, 2));
      setHasChanges(false); 
    }
  }, [rest, isEditing]);
  
  // Set the first week as active when learning plan loads
  React.useEffect(() => {
    if (rest.learning_plan?.weekly_plans && rest.learning_plan.weekly_plans.length > 0 && activeWeek === null) {
      setActiveWeek(1);
    }
  }, [activeWeek, rest.learning_plan?.weekly_plans]);
  
  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (isEditing) {
      // Reset to original state when canceling edit
      setEditableState(JSON.stringify(rest, null, 2));
      setHasChanges(false);
    }
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditableState(e.target.value);
    setHasChanges(true);
  };

  const handleSubmit = () => {
    try {
      const newState = JSON.parse(editableState);
      if (setState) setState({ ...newState, messages });
      setIsEditing(false);
      setHasChanges(false);
    } catch (error) {
      alert(`Invalid JSON format. Please check your input. \n\n${error}`);
    }
  };

  // Render learning plan in a structured way
  const renderLearningPlan = () => {
    const learningPlan = rest.learning_plan;
    
    if (!learningPlan) {
      return (
        <div className="flex items-center justify-center h-40 border border-dashed rounded-lg bg-muted/5">
          <p className="text-muted-foreground">No learning plan available.</p>
        </div>
      );
    }

    // Get the active week plan
    const activeWeekPlan = activeWeek !== null && learningPlan.weekly_plans[activeWeek - 1] 
      ? learningPlan.weekly_plans[activeWeek - 1] 
      : null;

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100">{learningPlan.topic}</h2>
          <div className="flex items-center mt-2 text-blue-700 dark:text-blue-300">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Duration: {learningPlan.duration_weeks} weeks</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {learningPlan.weekly_plans.map((_, idx) => (
            <Button
              key={idx}
              variant={activeWeek === idx + 1 ? "default" : "outline"}
              onClick={() => setActiveWeek(idx + 1)}
              className={activeWeek === idx + 1 ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              Week {idx + 1}
            </Button>
          ))}
        </div>

        {activeWeekPlan && (
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="border-b bg-muted/40 px-6 py-4">
              <h3 className="text-xl font-semibold">Week {activeWeek}: {activeWeekPlan.focus}</h3>
            </div>
            
            <div className="p-6 space-y-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h4 className="text-base font-semibold">Activities</h4>
                  <Badge variant="outline" className="text-xs">
                    {activeWeekPlan.activities.length}
                  </Badge>
                </div>
                
                <ul className="space-y-3">
                  {activeWeekPlan.activities.map((activity, idx) => (
                    <li key={idx} className="flex items-start gap-3 p-3 rounded-md bg-muted/20 hover:bg-muted/40 transition-colors">
                      <div className="mt-0.5 text-blue-600 dark:text-blue-400">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.description}</p>
                        {activity.frequency && (
                          <Badge variant="secondary" className="mt-2 text-xs">
                            {activity.frequency}
                          </Badge>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {activeWeekPlan.resources && activeWeekPlan.resources.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h4 className="text-base font-semibold">Resources</h4>
                    <Badge variant="outline" className="text-xs">
                      {activeWeekPlan.resources.length}
                    </Badge>
                  </div>
                  
                  <ul className="space-y-3">
                    {activeWeekPlan.resources.map((resource, idx) => (
                      <li key={idx} className="flex items-start gap-3 p-3 rounded-md bg-muted/20 hover:bg-muted/40 transition-colors">
                        <div className="mt-0.5 text-amber-600 dark:text-amber-400">
                          <Book className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{resource.name || resource.title}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {resource.type && (
                              <Badge variant="outline" className="text-xs">
                                {resource.type}
                              </Badge>
                            )}
                            {resource.url && (
                              <Button 
                                variant="link" 
                                className="p-0 h-auto text-xs" 
                                asChild
                              >
                                <a 
                                  href={resource.url.startsWith('http') ? resource.url : `https://${resource.url}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400"
                                >
                                  View Resource <ExternalLink size={10} />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeWeekPlan.checkpoint && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h4 className="text-base font-semibold">Checkpoint</h4>
                  </div>
                  <div className="p-4 rounded-md border-l-4 border-green-500 bg-green-50 dark:bg-green-950/20">
                    <p className="text-sm">{activeWeekPlan.checkpoint}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Get icon based on URL
  const getSourceIcon = (url: string | undefined) => {
    if (!url) return <Globe size={16} />;
    
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return <Youtube size={16} className="text-red-500" />;
    }
    
    return <Globe size={16} className="text-blue-500" />;
  };

  // Render search results if available
  const renderSearchResults = () => {
    const searchResults = rest.search_results;
    
    if (!searchResults || searchResults.length === 0) {
      return (
        <div className="flex items-center justify-center h-40 border border-dashed rounded-lg bg-muted/5">
          <div className="flex flex-col items-center text-muted-foreground">
            <Search className="h-8 w-8 mb-2 opacity-50" />
            <p>No search results available</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <div className="bg-gradient-to-r from-zinc-50 to-slate-50 dark:from-zinc-950/20 dark:to-slate-950/20 rounded-lg p-4 shadow-sm flex items-center gap-3">
          <Search className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Search Results</h3>
        </div>
        
        <div className="space-y-3">
          {searchResults.map((searchResult, searchIdx) => {
            const hasResults = searchResult.results && searchResult.results.length > 0;
            
            return (
              <Collapsible key={searchIdx} className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                  <div className="flex items-center gap-2">
                    {searchResult.query ? (
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        Result {searchIdx + 1}: {searchResult.query}
                      </span>
                    ) : (
                      <span className="font-medium text-slate-900 dark:text-slate-100">Result {searchIdx + 1}</span>
                    )}
                    {searchResult.response_time && (
                      <Badge variant="secondary" className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {searchResult.response_time}s
                      </Badge>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400 transition-transform duration-200 ui-open:rotate-180" />
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 space-y-5">
                    {searchResult.answer && searchResult.answer !== 'null' && (
                      <div className="p-4 rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Answer</h4>
                        <p className="text-sm text-blue-800 dark:text-blue-200">{searchResult.answer}</p>
                      </div>
                    )}
                    
                    {hasResults && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">Sources</h4>
                          <Badge variant="outline" className="text-xs border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                            {searchResult.results?.length || 0}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          {searchResult.results?.map((result, idx) => (
                            <Collapsible key={idx} className="border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
                              <CollapsibleTrigger className="flex w-full items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                                <div className="flex items-center gap-2">
                                  {getSourceIcon(result.url)}
                                  <span className="font-medium text-sm text-slate-900 dark:text-slate-100">
                                    {result.title || `Result ${idx + 1}`}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {result.score !== undefined && (
                                    <Badge variant="outline" className="text-xs border-slate-200 dark:border-slate-700">
                                      {result.score.toFixed(2)}
                                    </Badge>
                                  )}
                                  <ChevronRight className="h-4 w-4 text-slate-500 dark:text-slate-400 transition-transform duration-200 ui-open:rotate-90" />
                                </div>
                              </CollapsibleTrigger>
                              
                              <CollapsibleContent>
                                <div className="p-3 space-y-3 bg-white dark:bg-slate-950">
                                  {result.url && (
                                    <div className="text-xs">
                                      <Button 
                                        variant="link" 
                                        className="p-0 h-auto text-xs text-blue-600 dark:text-blue-400" 
                                        asChild
                                      >
                                        <a 
                                          href={result.url?.startsWith('http') ? result.url : `https://${result.url}`} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1"
                                        >
                                          {result.url} <ExternalLink size={10} />
                                        </a>
                                      </Button>
                                    </div>
                                  )}
                                  
                                  {(result.content || result.raw_content) && (
                                    <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap bg-slate-50 dark:bg-slate-900/50 p-3 rounded-md">
                                      {result.content || result.raw_content}
                                    </p>
                                  )}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {searchResult.follow_up_questions && searchResult.follow_up_questions !== 'null' && (
                      <div className="p-4 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                        <h4 className="text-sm font-medium text-amber-900 dark:text-amber-300 mb-2">Follow-up Questions</h4>
                        <p className="text-sm text-amber-800 dark:text-amber-200">{searchResult.follow_up_questions}</p>
                      </div>
                    )}
                    
                    {searchResult.images && searchResult.images.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">Images</h4>
                        <div className="flex flex-wrap gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-md">
                          {searchResult.images.map((image, imgIdx) => (
                            <div key={imgIdx} className="border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden shadow-sm">
                              {typeof image === 'string' && image.startsWith('http') ? (
                                <div className="relative w-[180px] h-[120px]">
                                  <Image 
                                    src={image} 
                                    alt={`Search result image ${imgIdx + 1}`}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="p-2 text-xs text-slate-600 dark:text-slate-400">
                                  {JSON.stringify(image)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </div>
    );
  };
  
  // Function to download learning plan as PDF
  const downloadLearningPlan = () => {
    // Create a formatted string of the learning plan
    const learningPlan = rest.learning_plan;
    if (!learningPlan) return;
    
    let content = `# ${learningPlan.topic}\n\nDuration: ${learningPlan.duration_weeks} weeks\n\n`;
    
    learningPlan.weekly_plans.forEach((week) => {
      content += `## Week ${week.week_number}: ${week.focus}\n\n`;
      
      content += "### Activities\n";
      week.activities.forEach((activity) => {
        content += `- ${activity.description} (${activity.frequency})\n`;
      });
      content += "\n";
      
      if (week.resources && week.resources.length > 0) {
        content += "### Resources\n";
        week.resources.forEach((resource) => {
          content += `- ${resource.name || resource.title} (${resource.type})${resource.url ? ': ' + resource.url : ''}\n`;
        });
        content += "\n";
      }
      
      if (week.checkpoint) {
        content += `### Checkpoint\n${week.checkpoint}\n\n`;
      }
    });
    
    // Create a blob and download it
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${learningPlan.topic.replace(/\s+/g, '_')}_learning_plan.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Function to download search results
  const downloadSearchResults = () => {
    const searchResults = rest.search_results;
    if (!searchResults || searchResults.length === 0) return;
    
    let content = `# Search Results\n\n`;
    
    searchResults.forEach((result, idx) => {
      content += `## Search ${idx + 1}${result.query ? ': ' + result.query : ''}\n\n`;
      
      if (result.answer && result.answer !== 'null') {
        content += `### Answer\n${result.answer}\n\n`;
      }
      
      if (result.results && result.results.length > 0) {
        content += `### Sources\n`;
        result.results.forEach((source, sourceIdx) => {
          content += `#### Source ${sourceIdx + 1}: ${source.title || 'Untitled'}\n`;
          if (source.url) content += `URL: ${source.url}\n`;
          if (source.content || source.raw_content) {
            content += `\n${source.content || source.raw_content}\n\n`;
          }
        });
      }
      
      if (result.follow_up_questions && result.follow_up_questions !== 'null') {
        content += `### Follow-up Questions\n${result.follow_up_questions}\n\n`;
      }
    });
    
    // Create a blob and download it
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search_results_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`${className} overflow-auto`}>
      <div className="sticky top-0 p-4 bg-background/95 backdrop-blur-sm shadow-sm z-10 flex justify-between items-center">
        <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">
          Learning Canvas
        </h2>
        <div className="flex gap-2">
          {hasChanges && (
            <Button
              onClick={handleSubmit}
              size="sm"
              variant="secondary"
            >
              Save
            </Button>
          )}
          <Button 
            onClick={handleEditToggle}
            size="sm"
            variant="outline"
          >
            {isEditing ? "Cancel" : "Edit"}
          </Button>
        </div>
      </div>
      
      <div className="p-4">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editableState}
              onChange={handleStateChange}
              className="w-full h-[calc(100vh-180px)] font-mono text-sm p-3 bg-background border rounded resize-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
              spellCheck="false"
            />
          </div>
        ) : (
          <Tabs defaultValue="visual" className="w-full">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="visual">Visual</TabsTrigger>
                <TabsTrigger value="json">JSON</TabsTrigger>
              </TabsList>
              
              <div className="flex gap-2">
                {rest.learning_plan && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={downloadLearningPlan}
                    className="flex items-center gap-1 text-xs"
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    Learning Plan
                  </Button>
                )}
                
                {rest.search_results && rest.search_results.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={downloadSearchResults}
                    className="flex items-center gap-1 text-xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Search Results
                  </Button>
                )}
              </div>
            </div>
            
            <TabsContent value="visual" className="space-y-6 h-[calc(100vh-180px)] overflow-y-auto pr-2">
              {renderLearningPlan()}
              {renderSearchResults()}
            </TabsContent>
            <TabsContent value="json">
              <pre className="font-mono text-sm h-[calc(100vh-180px)] whitespace-pre-wrap break-words w-full overflow-x-hidden p-3 bg-muted/50 border rounded">
                {editableState}
              </pre>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}