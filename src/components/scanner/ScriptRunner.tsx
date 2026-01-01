import { useState, useEffect } from "react";
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
  Lock,
  AlertCircle,
  XCircle,
  Search,
  Filter,
  Download,
  Pause,
  RotateCcw,
  Target,
  Zap,
  Eye,
  Bug
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScriptResult } from "@/types/scanner";
import { SecurityScript } from "@/lib/script-engine";

interface ScriptRunnerProps {
  scriptResults: ScriptResult[];
  isRunning: boolean;
  availableScripts: SecurityScript[];
  onRunScripts: (scriptIds: string[]) => void;
}

const SEVERITY_STYLES = {
  info: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  low: { icon: CheckCircle, color: "text-success", bg: "bg-success/10", border: "border-success/20" },
  medium: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", border: "border-warning/20" },
  high: { icon: AlertCircle, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  critical: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20" },
};

const CATEGORY_ICONS: Record<string, any> = {
  auth: Lock,
  discovery: FolderOpen,
  safe: Shield,
  intrusive: Zap,
  vuln: Bug,
  default: FileCode,
  malware: XCircle
};

const CATEGORY_COLORS: Record<string, string> = {
  auth: "text-purple-400",
  discovery: "text-blue-400", 
  safe: "text-green-400",
  intrusive: "text-orange-400",
  vuln: "text-red-400",
  default: "text-gray-400",
  malware: "text-red-600"
};

export function ScriptRunner({ scriptResults, isRunning, availableScripts, onRunScripts }: ScriptRunnerProps) {
  const [selectedScripts, setSelectedScripts] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["safe"]);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("scripts");
  const [runProgress, setRunProgress] = useState(0);

  // Group scripts by category
  const scriptsByCategory = availableScripts.reduce((acc, script) => {
    if (!acc[script.category]) {
      acc[script.category] = [];
    }
    acc[script.category].push(script);
    return acc;
  }, {} as Record<string, SecurityScript[]>);

  // Filter scripts based on search and filters
  const filteredScripts = availableScripts.filter(script => {
    const matchesSearch = script.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         script.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || script.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Filter results based on severity
  const filteredResults = scriptResults.filter(result => {
    return severityFilter === "all" || result.severity === severityFilter;
  });

  // Auto-select safe scripts by default
  useEffect(() => {
    if (selectedScripts.length === 0 && availableScripts.length > 0) {
      const safeScripts = availableScripts
        .filter(script => script.category === 'safe')
        .map(script => script.id);
      setSelectedScripts(safeScripts);
    }
  }, [availableScripts, selectedScripts.length]);

  // Simulate progress during script execution
  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        setRunProgress(prev => {
          if (prev >= 95) return prev;
          return prev + Math.random() * 10;
        });
      }, 500);
      return () => clearInterval(interval);
    } else {
      setRunProgress(0);
    }
  }, [isRunning]);

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
    const scripts = scriptsByCategory[categoryId] || [];
    const scriptIds = scripts.map(s => s.id);
    const allSelected = scriptIds.every(id => selectedScripts.includes(id));
    if (allSelected) {
      setSelectedScripts(prev => prev.filter(id => !scriptIds.includes(id)));
    } else {
      setSelectedScripts(prev => [...new Set([...prev, ...scriptIds])]);
    }
  };

  const selectPreset = (preset: string) => {
    let presetScripts: string[] = [];
    switch (preset) {
      case 'safe':
        presetScripts = availableScripts.filter(s => s.category === 'safe').map(s => s.id);
        break;
      case 'discovery':
        presetScripts = availableScripts.filter(s => s.category === 'discovery').map(s => s.id);
        break;
      case 'vuln':
        presetScripts = availableScripts.filter(s => s.category === 'vuln').map(s => s.id);
        break;
      case 'all':
        presetScripts = availableScripts.map(s => s.id);
        break;
    }
    setSelectedScripts(presetScripts);
  };

  const getCategoryName = (category: string): string => {
    const names: Record<string, string> = {
      auth: 'Authentication',
      discovery: 'Discovery',
      safe: 'Safe Checks',
      intrusive: 'Intrusive',
      vuln: 'Vulnerability',
      default: 'Default',
      malware: 'Malware Detection'
    };
    return names[category] || category.charAt(0).toUpperCase() + category.slice(1);
  };

  const exportResults = () => {
    const data = {
      timestamp: new Date().toISOString(),
      target: scriptResults[0]?.host || 'unknown',
      totalScripts: scriptResults.length,
      results: scriptResults.map(result => ({
        script: result.name,
        category: result.category,
        severity: result.severity,
        output: result.output,
        findings: result.findings,
        duration: result.duration,
        timestamp: result.timestamp
      }))
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `netprobe-script-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSeverityStats = () => {
    const stats = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    scriptResults.forEach(result => {
      stats[result.severity]++;
    });
    return stats;
  };

  const severityStats = getSeverityStats();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileCode className="h-5 w-5 text-primary" />
            Security Scripts
          </h2>
          <p className="text-sm text-muted-foreground">
            NSE-inspired security analysis scripts • {availableScripts.length} available
          </p>
        </div>
        <div className="flex items-center gap-2">
          {scriptResults.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportResults}>
              <Download className="h-4 w-4 mr-2" />
              Export Results
            </Button>
          )}
          <Button 
            onClick={() => onRunScripts(selectedScripts)} 
            disabled={isRunning || selectedScripts.length === 0}
            className="min-w-[140px]"
          >
            {isRunning ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run {selectedScripts.length} Scripts
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      {isRunning && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-2"
        >
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Script execution progress</span>
            <span className="font-mono">{Math.round(runProgress)}%</span>
          </div>
          <Progress value={runProgress} className="h-2" />
        </motion.div>
      )}

      {/* Quick Stats */}
      {scriptResults.length > 0 && (
        <div className="grid grid-cols-5 gap-4">
          {Object.entries(severityStats).map(([severity, count]) => {
            const style = SEVERITY_STYLES[severity as keyof typeof SEVERITY_STYLES];
            const Icon = style.icon;
            return (
              <Card key={severity} className={`p-3 ${style.border}`}>
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${style.color}`} />
                  <div>
                    <div className="text-lg font-semibold">{count}</div>
                    <div className="text-xs text-muted-foreground capitalize">{severity}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scripts" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Script Selection
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Results ({scriptResults.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scripts" className="space-y-4">
          {/* Script Selection Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search scripts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.keys(scriptsByCategory).map(category => (
                  <SelectItem key={category} value={category}>
                    {getCategoryName(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preset Selection */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Quick select:</span>
            <Button variant="outline" size="sm" onClick={() => selectPreset('safe')}>
              <Shield className="h-3 w-3 mr-1" />
              Safe Only
            </Button>
            <Button variant="outline" size="sm" onClick={() => selectPreset('discovery')}>
              <FolderOpen className="h-3 w-3 mr-1" />
              Discovery
            </Button>
            <Button variant="outline" size="sm" onClick={() => selectPreset('vuln')}>
              <Bug className="h-3 w-3 mr-1" />
              Vulnerability
            </Button>
            <Button variant="outline" size="sm" onClick={() => selectPreset('all')}>
              All Scripts
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelectedScripts([])}>
              <RotateCcw className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>

          {/* Script Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Available Scripts ({filteredScripts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-2">
                  {Object.entries(scriptsByCategory).map(([categoryId, scripts]) => {
                    const filteredCategoryScripts = scripts.filter(script => 
                      filteredScripts.includes(script)
                    );
                    
                    if (filteredCategoryScripts.length === 0) return null;
                    
                    const CategoryIcon = CATEGORY_ICONS[categoryId] || FileCode;
                    const isExpanded = expandedCategories.includes(categoryId);
                    const selectedCount = filteredCategoryScripts.filter(script => 
                      selectedScripts.includes(script.id)
                    ).length;

                    return (
                      <Collapsible key={categoryId} open={isExpanded}>
                        <div className="flex items-center gap-2 p-3 rounded-lg hover:bg-secondary/50 border border-border">
                          <CollapsibleTrigger 
                            onClick={() => toggleCategory(categoryId)}
                            className="flex items-center gap-2 flex-1"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <CategoryIcon className={`h-4 w-4 ${CATEGORY_COLORS[categoryId]}`} />
                            <span className="text-sm font-medium">{getCategoryName(categoryId)}</span>
                            <Badge variant="secondary" className="text-xs">
                              {filteredCategoryScripts.length}
                            </Badge>
                          </CollapsibleTrigger>
                          {selectedCount > 0 && (
                            <Badge variant="default" className="text-xs">
                              {selectedCount} selected
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => selectAllInCategory(categoryId)}
                          >
                            {selectedCount === filteredCategoryScripts.length ? "None" : "All"}
                          </Button>
                        </div>
                        <CollapsibleContent>
                          <div className="ml-6 space-y-2 mt-2">
                            {filteredCategoryScripts.map((script) => (
                              <motion.div
                                key={script.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/30 cursor-pointer border border-transparent hover:border-border"
                                onClick={() => toggleScript(script.id)}
                              >
                                <Checkbox
                                  checked={selectedScripts.includes(script.id)}
                                  onCheckedChange={() => toggleScript(script.id)}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="text-sm font-medium">{script.name}</p>
                                    <Badge 
                                      variant={script.category === 'intrusive' ? 'destructive' : 'outline'} 
                                      className="text-xs"
                                    >
                                      {script.category}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground mb-2">
                                    {script.description}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>by {script.author}</span>
                                    <span>•</span>
                                    <span>{script.license}</span>
                                  </div>
                                </div>
                              </motion.div>
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
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {/* Results Filter */}
          <div className="flex items-center gap-4">
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Script Results */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Script Results ({filteredResults.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                {filteredResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <FileCode className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium">No Results Yet</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Select and run scripts to see security analysis results
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence>
                      {filteredResults.map((result, index) => {
                        const severity = SEVERITY_STYLES[result.severity];
                        const SeverityIcon = severity.icon;

                        return (
                          <motion.div
                            key={`${result.scriptId}-${index}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className={`p-4 rounded-lg border ${severity.border} ${severity.bg}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${severity.bg}`}>
                                <SeverityIcon className={`h-5 w-5 ${severity.color}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium">{result.name}</span>
                                  <Badge variant="outline" className="text-xs font-mono">
                                    {result.host}{result.port ? `:${result.port}` : ''}
                                  </Badge>
                                  <Badge 
                                    variant={result.severity === 'critical' || result.severity === 'high' ? 'destructive' : 'default'} 
                                    className="text-xs"
                                  >
                                    {result.severity.toUpperCase()}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {result.category}
                                  </Badge>
                                </div>
                                
                                <div className="mb-3">
                                  <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono bg-secondary/30 p-3 rounded border">
                                    {result.output}
                                  </pre>
                                </div>
                                
                                {result.findings && result.findings.length > 0 && (
                                  <div className="mb-3 space-y-2">
                                    <h4 className="text-sm font-medium text-warning">Security Findings:</h4>
                                    {result.findings.map((finding, idx) => (
                                      <div key={idx} className="p-3 rounded-lg bg-secondary/50 border border-border">
                                        <div className="flex items-center gap-2 mb-1">
                                          <AlertTriangle className="h-4 w-4 text-warning" />
                                          <div className="font-medium text-sm">{finding.title}</div>
                                          <Badge variant="outline" className="text-xs">
                                            {finding.severity}
                                          </Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground mb-2">
                                          {finding.description}
                                        </div>
                                        {finding.remediation && (
                                          <div className="text-sm text-primary">
                                            <strong>Remediation:</strong> {finding.remediation}
                                          </div>
                                        )}
                                        {finding.cve && (
                                          <div className="text-sm text-destructive mt-1">
                                            <strong>CVE:</strong> {finding.cve}
                                            {finding.cvss && <span className="ml-2">CVSS: {finding.cvss}</span>}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{result.duration}ms</span>
                                  </div>
                                  <span>•</span>
                                  <span>{result.timestamp.toLocaleString()}</span>
                                  <span>•</span>
                                  <span className="capitalize">{result.state}</span>
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
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
