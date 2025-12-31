import { useState } from "react";
import { motion } from "framer-motion";
import { 
  FileText, 
  Download, 
  FileJson, 
  FileSpreadsheet,
  File,
  Clock,
  Target,
  Server,
  AlertTriangle,
  CheckCircle,
  Info,
  BarChart3,
  PieChart,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ScanResult, Host, ServiceInfo, Finding } from "@/types/scanner";
import { ReportGenerator } from "@/lib/report-generator";
import { toast } from "sonner";

interface ReportsPanelProps {
  scanResult: ScanResult | null;
  hosts: Host[];
  services: ServiceInfo[];
  findings: Finding[];
  onExport?: (format: "json" | "csv" | "pdf") => void;
}

export function ReportsPanel({ scanResult, hosts, services, findings, onExport }: ReportsPanelProps) {
  const [activeView, setActiveView] = useState("summary");
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const handleExport = async (format: "json" | "csv" | "pdf") => {
    if (!scanResult) {
      toast.error("No scan data available for export");
      return;
    }

    setIsGenerating(format);
    
    try {
      await ReportGenerator.generateReport(format, scanResult, hosts, services, findings);
      toast.success(`${format.toUpperCase()} report generated successfully`);
      
      // Call the optional onExport callback
      onExport?.(format);
    } catch (error) {
      console.error(`Error generating ${format} report:`, error);
      toast.error(`Failed to generate ${format.toUpperCase()} report`);
    } finally {
      setIsGenerating(null);
    }
  };

  if (!scanResult) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium">No Scan Data</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Complete a scan to generate reports
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const openPorts = scanResult.ports.filter(p => p.status === "open");
  const filteredPorts = scanResult.ports.filter(p => p.status === "filtered");
  const severityCounts = {
    info: findings.filter(f => f.severity === "info").length,
    low: findings.filter(f => f.severity === "low").length,
    medium: findings.filter(f => f.severity === "medium").length,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Scan Reports</h2>
          <p className="text-sm text-muted-foreground">
            Analysis summary and export options
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleExport("json")}
            disabled={isGenerating !== null}
          >
            {isGenerating === "json" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileJson className="h-4 w-4 mr-2" />
            )}
            JSON
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleExport("csv")}
            disabled={isGenerating !== null}
          >
            {isGenerating === "csv" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 mr-2" />
            )}
            CSV
          </Button>
          <Button 
            size="sm" 
            onClick={() => handleExport("pdf")}
            disabled={isGenerating !== null}
          >
            {isGenerating === "pdf" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <File className="h-4 w-4 mr-2" />
            )}
            PDF Report
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{hosts.length}</p>
                <p className="text-xs text-muted-foreground">Hosts Discovered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-success/10">
                <Server className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{openPorts.length}</p>
                <p className="text-xs text-muted-foreground">Open Ports</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-warning/10">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{findings.length}</p>
                <p className="text-xs text-muted-foreground">Findings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-muted">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Math.round(scanResult.duration / 1000)}s</p>
                <p className="text-xs text-muted-foreground">Scan Duration</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="findings">Findings</TabsTrigger>
          <TabsTrigger value="hosts">Hosts</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Severity Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-primary" />
                  Finding Severity Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm flex-1">Informational</span>
                    <span className="font-mono text-sm">{severityCounts.info}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-success" />
                    <span className="text-sm flex-1">Low</span>
                    <span className="font-mono text-sm">{severityCounts.low}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-warning" />
                    <span className="text-sm flex-1">Medium</span>
                    <span className="font-mono text-sm">{severityCounts.medium}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Port State Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Port State Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-success" />
                    <span className="text-sm flex-1">Open</span>
                    <span className="font-mono text-sm">{openPorts.length}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-warning" />
                    <span className="text-sm flex-1">Filtered</span>
                    <span className="font-mono text-sm">{filteredPorts.length}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                    <span className="text-sm flex-1">Closed</span>
                    <span className="font-mono text-sm">
                      {scanResult.ports.length - openPorts.length - filteredPorts.length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scan Info */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Scan Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Target</p>
                    <p className="font-mono">{scanResult.target}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Scan Type</p>
                    <p className="capitalize">{scanResult.scanType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Started</p>
                    <p>{new Date(scanResult.startTime).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="findings" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <ScrollArea className="h-[400px]">
                {findings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CheckCircle className="h-12 w-12 text-success mb-4" />
                    <h3 className="font-medium">No Issues Found</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      The scan completed without detecting any notable findings
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {findings.map((finding, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-lg border border-border"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-1.5 rounded ${
                            finding.severity === "medium" ? "bg-warning/10" :
                            finding.severity === "low" ? "bg-success/10" : "bg-blue-500/10"
                          }`}>
                            {finding.severity === "medium" ? (
                              <AlertTriangle className="h-4 w-4 text-warning" />
                            ) : finding.severity === "low" ? (
                              <CheckCircle className="h-4 w-4 text-success" />
                            ) : (
                              <Info className="h-4 w-4 text-blue-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{finding.title}</h4>
                              <Badge variant="outline" className="text-xs capitalize">
                                {finding.severity}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {finding.description}
                            </p>
                            {finding.remediation && (
                              <div className="p-2 rounded bg-secondary/50 text-sm">
                                <span className="text-xs text-muted-foreground block mb-1">
                                  Remediation:
                                </span>
                                {finding.remediation}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hosts" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {hosts.map((host, index) => (
                    <div
                      key={host.ip}
                      className="flex items-center justify-between p-3 rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${
                          host.status === "up" ? "bg-success" : "bg-muted-foreground"
                        }`} />
                        <div>
                          <p className="font-mono">{host.ip}</p>
                          {host.hostname && (
                            <p className="text-xs text-muted-foreground">{host.hostname}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {host.osInfo && (
                          <Badge variant="outline">{host.osInfo.name}</Badge>
                        )}
                        <Badge variant="secondary">
                          {host.ports.filter(p => p.status === "open").length} open ports
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {services.map((service, index) => (
                    <div
                      key={`${service.port}-${index}`}
                      className="flex items-center justify-between p-3 rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono">
                          :{service.port}
                        </Badge>
                        <div>
                          <p className="font-medium">{service.name}</p>
                          {service.product && (
                            <p className="text-xs text-muted-foreground">
                              {service.product} {service.version}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {service.secure && (
                          <Badge variant="secondary" className="text-success">
                            Encrypted
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {service.confidence}% confidence
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
