import { motion } from "framer-motion";
import { Hash, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PortRangeSelectorProps {
  startPort: number;
  endPort: number;
  onStartPortChange: (value: number) => void;
  onEndPortChange: (value: number) => void;
  isScanning: boolean;
}

const PRESETS = [
  { label: "Top 100", start: 1, end: 100 },
  { label: "Top 1000", start: 1, end: 1000 },
  { label: "Common", start: 1, end: 1024 },
  { label: "All", start: 1, end: 65535 },
];

export function PortRangeSelector({
  startPort,
  endPort,
  onStartPortChange,
  onEndPortChange,
  isScanning,
}: PortRangeSelectorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-3"
    >
      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Hash className="h-4 w-4" />
        Port Range
      </label>

      <div className="flex gap-2 flex-wrap">
        {PRESETS.map((preset) => (
          <Button
            key={preset.label}
            variant="terminal"
            size="sm"
            disabled={isScanning}
            onClick={() => {
              onStartPortChange(preset.start);
              onEndPortChange(preset.end);
            }}
            className="text-xs"
          >
            <Zap className="h-3 w-3 mr-1" />
            {preset.label}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input
            type="number"
            value={startPort}
            onChange={(e) => onStartPortChange(parseInt(e.target.value) || 1)}
            min={1}
            max={65535}
            disabled={isScanning}
            className="font-mono bg-secondary/50 border-border focus:border-primary h-10 text-center"
          />
        </div>
        <span className="text-muted-foreground font-mono">—</span>
        <div className="flex-1">
          <Input
            type="number"
            value={endPort}
            onChange={(e) => onEndPortChange(parseInt(e.target.value) || 65535)}
            min={1}
            max={65535}
            disabled={isScanning}
            className="font-mono bg-secondary/50 border-border focus:border-primary h-10 text-center"
          />
        </div>
      </div>
    </motion.div>
  );
}
