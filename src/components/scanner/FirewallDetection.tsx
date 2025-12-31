import { motion } from "framer-motion";
import { 
  ShieldAlert, 
  Clock, 
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Timer,
  TrendingUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FirewallInfo, PortResult } from "@/types/scanner";

interface FirewallDetectionProps {
  firewallInfo: FirewallInfo | null;
  ports: PortResult[];
  isAnalyzing: boolean;
  onAnalyzeFirewall: () => void;
}

export function FirewallDetection({ 
  firewallInfo, 
  ports, 
  isAnalyzing, 
  onAnalyzeFirewall 
}: FirewallDetectionProps) {
  const filteredPorts = ports.filter(p => p.state === "filtered");
  const openPorts = ports.filter(p => p.state === "open");
  const closedPorts = ports.filter(p => p.state === "closed");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Firewall & Filtering Detection</h2>
          <p className="text-sm text-muted-foreground">
            Packet response analysis and rate-limit detection
          </p>
        </div>
        <Button onClick={onAnalyzeFirewall} disabled={isAnalyzing}>
          <ShieldAlert className="h-4 w-4 mr-2" />
          {isAnalyzing ? "Analyzing..." : "Analyze Firewall"}
        </Button>
      </div>

      {/* Port State Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-success/10">
                <CheckCircle className="h-5 w-5 text-success" />
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
                <p className="text-2xl font-bold">{filteredPorts.length}</p>
                <p className="text-xs text-muted-foreground">Filtered Ports</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-muted">
                <XCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{closedPorts.length}</p>
                <p className="text-xs text-muted-foreground">Closed Ports</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {firewallInfo ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Firewall Detection Results */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-primary" />
                Detection Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Firewall Detected</span>
                <Badge variant={firewallInfo.detected ? "default" : "secondary"}>
                  {firewallInfo.detected ? "Yes" : "No"}
                </Badge>
              </div>
              
              {firewallInfo.type && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <span className="text-sm font-medium">{firewallInfo.type}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Confidence</span>
                <span className="text-sm font-mono">{firewallInfo.confidence}%</span>
              </div>
              <Progress value={firewallInfo.confidence} className="h-2" />

              <div className="pt-4 border-t border-border space-y-3">
                <h4 className="text-sm font-medium">Indicators</h4>
                {firewallInfo.indicators.map((indicator, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <Activity className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{indicator}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Timing Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Timer className="h-4 w-4 text-primary" />
                Response Timing Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Avg Response</span>
                  </div>
                  <p className="text-lg font-mono">{firewallInfo.avgResponseTime}ms</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Variance</span>
                  </div>
                  <p className="text-lg font-mono">{firewallInfo.responseVariance}ms</p>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Rate Limiting</span>
                  <Badge variant={firewallInfo.rateLimitDetected ? "destructive" : "secondary"}>
                    {firewallInfo.rateLimitDetected ? "Detected" : "None"}
                  </Badge>
                </div>

                {firewallInfo.rateLimitDetected && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                    <p className="text-sm text-destructive">
                      Rate limiting detected. Scan results may be incomplete.
                      Consider using slower timing templates.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-medium mb-3">Packet Behavior</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dropped packets</span>
                    <span className="font-mono">{firewallInfo.droppedPackets}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reset responses</span>
                    <span className="font-mono">{firewallInfo.resetResponses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ICMP unreachable</span>
                    <span className="font-mono">{firewallInfo.icmpUnreachable}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ShieldAlert className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium">No Firewall Analysis</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Run a port scan first, then analyze firewall behavior
            </p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
