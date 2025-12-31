import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertCircle, Filter, Download, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export interface PortResult {
  port: number;
  status: "open" | "closed" | "filtered";
  service: string;
  latency: number;
}

interface ScanResultsProps {
  results: PortResult[];
  isScanning: boolean;
}

const STATUS_CONFIG = {
  open: {
    icon: CheckCircle2,
    color: "text-success",
    bg: "bg-success/10",
    border: "border-success/30",
  },
  closed: {
    icon: XCircle,
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/30",
  },
  filtered: {
    icon: AlertCircle,
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/30",
  },
};

export function ScanResults({ results, isScanning }: ScanResultsProps) {
  const [filter, setFilter] = useState<"all" | "open" | "closed" | "filtered">("all");

  const filteredResults = results.filter(
    (r) => filter === "all" || r.status === filter
  );

  const openCount = results.filter((r) => r.status === "open").length;
  const closedCount = results.filter((r) => r.status === "closed").length;
  const filteredCount = results.filter((r) => r.status === "filtered").length;

  const copyResults = () => {
    const text = filteredResults
      .map((r) => `${r.port}\t${r.status}\t${r.service}\t${r.latency}ms`)
      .join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Results copied to clipboard");
  };

  const exportCSV = () => {
    const csv = [
      "Port,Status,Service,Latency(ms)",
      ...filteredResults.map((r) => `${r.port},${r.status},${r.service},${r.latency}`),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scan-results.csv";
    a.click();
    toast.success("Results exported");
  };

  if (results.length === 0 && !isScanning) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
          <Filter className="h-8 w-8" />
        </div>
        <p className="text-sm font-mono">No scan results yet</p>
        <p className="text-xs mt-1">Configure target and start scanning</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Stats Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
              filter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({results.length})
          </button>
          <button
            onClick={() => setFilter("open")}
            className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
              filter === "open"
                ? "bg-success text-success-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            Open ({openCount})
          </button>
          <button
            onClick={() => setFilter("closed")}
            className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
              filter === "closed"
                ? "bg-destructive text-destructive-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            Closed ({closedCount})
          </button>
          <button
            onClick={() => setFilter("filtered")}
            className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
              filter === "filtered"
                ? "bg-warning text-warning-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            Filtered ({filteredCount})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={copyResults}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Results Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="grid grid-cols-4 gap-4 px-4 py-3 bg-secondary/50 border-b border-border text-xs font-mono text-muted-foreground uppercase tracking-wider">
          <div>Port</div>
          <div>Status</div>
          <div>Service</div>
          <div className="text-right">Latency</div>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {filteredResults.map((result, index) => {
              const config = STATUS_CONFIG[result.status];
              const Icon = config.icon;

              return (
                <motion.div
                  key={result.port}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.02 }}
                  className={`grid grid-cols-4 gap-4 px-4 py-3 border-b border-border/50 hover:bg-secondary/30 transition-colors ${config.bg}`}
                >
                  <div className="font-mono text-sm text-foreground">
                    {result.port}
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${config.color}`} />
                    <span className={`text-sm font-medium ${config.color}`}>
                      {result.status}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground font-mono">
                    {result.service}
                  </div>
                  <div className="text-sm text-muted-foreground font-mono text-right">
                    {result.latency}ms
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
