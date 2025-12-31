import { motion, AnimatePresence } from "framer-motion";
import { Terminal as TerminalIcon } from "lucide-react";
import { useEffect, useRef } from "react";

interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

interface TerminalOutputProps {
  logs: LogEntry[];
}

const TYPE_COLORS = {
  info: "text-muted-foreground",
  success: "text-success",
  warning: "text-warning",
  error: "text-destructive",
};

export function TerminalOutput({ logs }: TerminalOutputProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden terminal-bg">
      <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 border-b border-border">
        <TerminalIcon className="h-4 w-4 text-primary" />
        <span className="text-xs font-mono text-muted-foreground">
          Scanner Output
        </span>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-destructive/60" />
          <div className="w-3 h-3 rounded-full bg-warning/60" />
          <div className="w-3 h-3 rounded-full bg-success/60" />
        </div>
      </div>

      <div
        ref={scrollRef}
        className="h-48 overflow-y-auto p-4 font-mono text-xs space-y-1"
      >
        <AnimatePresence mode="popLayout">
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2"
            >
              <span className="text-muted-foreground shrink-0">
                [{formatTime(log.timestamp)}]
              </span>
              <span className={TYPE_COLORS[log.type]}>{log.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>

        {logs.length === 0 && (
          <div className="text-muted-foreground/50">
            Waiting for scan to begin...
          </div>
        )}

        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="inline-block w-2 h-4 bg-primary ml-1"
        />
      </div>
    </div>
  );
}
