import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileCode, 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Clock,
  ChevronDown,
  ChevronRight,
  Shield,
  FolderOpen,
  Lock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScriptResult } from "@/types/scanner";

interface ScriptRunnerProps {
  scriptResults: ScriptResult[];
  isRunning: boolean;
  onRunScripts: (scriptIds: string[]) => void;
}

const SCRIPT_CATEGORIES = [
  {
    id: "auth",
    name: "Authentication Checks",
    icon: Lock,
    scripts: [
      { id: "anon-ftp", name: "Anonymous FTP Check", description: "Tests for anonymous FTP access" },
      { id: "default-creds", name: "Default Credentials", description: "Checks for default login credentials" },
    ],
  },
  {
    id: "config",
    name: "Configuration Analysis",
    icon: Shield,
    scripts: [
      { id: "ssl-cert", name: "SSL Certificate Info", description: "Retrieves SSL/TLS certificate details" },
      { id: "http-headers", name: "HTTP Security Headers", description: "Analyzes HTTP security headers" },
      { id: "ssh-auth", name: "SSH Auth Methods", description: "Enumerates SSH authentication methods" },
    ],
  },
  {
    id: "info",
    name: "Information Disclosure",
    icon: Info,
    scripts: [
      { id: "http-title", name: "HTTP Page Title", description: "Extracts web page titles" },
      { id: "robots-txt", name: "Robots.txt", description: "Retrieves robots.txt content" },
      { id: "server-info", name: "Server Information", description: "Gathers server version info" },
    ],
  },
  {
    id: "discovery",
    name: "Service Discovery",
    icon: FolderOpen,
    scripts: [
      { id: "http-enum", name: "HTTP Enumeration", description: "Discovers common web paths" },
      { id: "dns-records", name: "DNS Records", description: "Retrieves DNS record information" },
    ],
  },
];

const SEVERITY_STYLES = {
  info: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10" },
  low: { icon: CheckCircle, color: "text-success", bg: "bg-success/10" },
  medium: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10" },
};

export function ScriptRunner({ scriptResults, isRunning, onRunScripts }: ScriptRunnerProps) {
  const [selectedScripts, setSelectedScripts] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["auth"]);

  const toggleScript = (scriptId: string) => {
    setSelectedScripts(prev => 
      prev.includes(scriptId) 
        ? prev.filter(id => id !== scriptId)
        : [...prev, scriptId]
    );
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const selectAllInCategory = (categoryId: string) => {
    const category = SCRIPT_CATEGORIES.find(c => c.id === categoryId);
    if (category) {
      const scriptIds = category.scripts.map(s => s.id);
      const allSelected = scriptIds.every(id => selectedScripts.includes(id));
      if (allSelected) {
        setSelectedScripts(prev => prev.filter(id => !scriptIds.includes(id)));
      } else {
        setSelectedScripts(prev => [...new Set([...prev, ...scriptIds])]);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Scriptable Checks</h2>
          <p className="text-sm text-muted-foreground">
            Non-destructive security analysis scripts
          </p>
        </div>
        <Button 
          onClick={() => onRunScripts(selectedScripts)} 
          disabled={isRunning || selectedScripts.length === 0}
        >
          <Play className="h-4 w-4 mr-2" />
          {isRunning ? "Running..." : `Run ${selectedScripts.length} Scripts`}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Script Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Available Scripts</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {SCRIPT_CATEGORIES.map((category) => {
                  const CategoryIcon = category.icon;
                  const isExpanded = expandedCategories.includes(category.id);
                  const categoryScriptIds = category.scripts.map(s => s.id);
                  const selectedCount = categoryScriptIds.filter(id => 
                    selectedScripts.includes(id)
                  ).length;

                  return (
                    <Collapsible key={category.id} open={isExpanded}>
                      <div className="flex items-center gap-2 p-2 rounded-md hover:bg-secondary/50">
                        <CollapsibleTrigger 
                          onClick={() => toggleCategory(category.id)}
                          className="flex items-center gap-2 flex-1"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <CategoryIcon className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">{category.name}</span>
                        </CollapsibleTrigger>
                        {selectedCount > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {selectedCount}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => selectAllInCategory(category.id)}
                        >
                          {selectedCount === category.scripts.length ? "None" : "All"}
                        </Button>
                      </div>
                      <CollapsibleContent>
                        <div className="ml-6 space-y-1 mt-1">
                          {category.scripts.map((script) => (
                            <div
                              key={script.id}
                              className="flex items-start gap-3 p-2 rounded-md hover:bg-secondary/30 cursor-pointer"
                              onClick={() => toggleScript(script.id)}
                            >
                              <Checkbox
                                checked={selectedScripts.includes(script.id)}
                                onCheckedChange={() => toggleScript(script.id)}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{script.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {script.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Script Results */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Results</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              {scriptResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <FileCode className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium">No Results Yet</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select and run scripts to see results
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {scriptResults.map((result, index) => {
                      const severity = SEVERITY_STYLES[result.severity];
                      const SeverityIcon = severity.icon;

                      return (
                        <motion.div
                          key={`${result.scriptId}-${index}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="p-3 rounded-lg border border-border bg-card"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-1.5 rounded ${severity.bg}`}>
                              <SeverityIcon className={`h-4 w-4 ${severity.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{result.scriptId}</span>
                                <Badge variant="outline" className="text-xs font-mono">
                                  {result.host}:{result.port}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {result.output}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{result.duration}ms</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
