import { motion } from "framer-motion";
import { Clock, ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ScanHistoryEntry {
  id: string;
  target: string;
  timestamp: Date;
  openPorts: number;
  totalPorts: number;
  duration: number;
}

interface ScanHistoryProps {
  history: ScanHistoryEntry[];
  onSelect: (entry: ScanHistoryEntry) => void;
  onClear: () => void;
}

export function ScanHistory({ history, onSelect, onClear }: ScanHistoryProps) {
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  };

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm font-mono">No scan history</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Recent Scans
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="space-y-2">
        {history.map((entry, index) => (
          <motion.button
            key={entry.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelect(entry)}
            className="w-full p-3 rounded-lg bg-secondary/30 border border-border hover:border-primary/30 hover:bg-secondary/50 transition-all group text-left"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm text-foreground truncate">
                  {entry.target}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{formatDate(entry.timestamp)}</span>
                  <span>{formatTime(entry.timestamp)}</span>
                  <span className="text-success">
                    {entry.openPorts} open
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
