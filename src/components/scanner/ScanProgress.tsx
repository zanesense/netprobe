import { motion } from "framer-motion";
import { Activity, Clock, Target } from "lucide-react";

interface ScanProgressProps {
  isScanning: boolean;
  progress: number;
  currentPort: number;
  elapsedTime: number;
  portsScanned: number;
  totalPorts: number;
}

export function ScanProgress({
  isScanning,
  progress,
  currentPort,
  elapsedTime,
  portsScanned,
  totalPorts,
}: ScanProgressProps) {
  if (!isScanning && progress === 0) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="space-y-4 p-4 rounded-lg bg-secondary/30 border border-border"
    >
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Activity className="h-4 w-4 text-primary animate-pulse" />
          <span className="font-mono">
            {isScanning ? "Scanning..." : "Complete"}
          </span>
        </div>
        <div className="flex items-center gap-4 font-mono text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {formatTime(elapsedTime)}
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Target className="h-3.5 w-3.5" />
            Port {currentPort}
          </div>
        </div>
      </div>

      <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
        {isScanning && (
          <motion.div
            className="absolute inset-y-0 w-20 scan-line"
            animate={{ x: ["-100%", "500%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        )}
      </div>

      <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
        <span>{portsScanned} / {totalPorts} ports</span>
        <span className="text-primary">{progress.toFixed(1)}%</span>
      </div>
    </motion.div>
  );
}
