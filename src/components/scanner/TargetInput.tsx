import { motion } from "framer-motion";
import { Globe, Server } from "lucide-react";
import { Input } from "@/components/ui/input";

interface TargetInputProps {
  target: string;
  onChange: (value: string) => void;
  isScanning: boolean;
}

export function TargetInput({ target, onChange, isScanning }: TargetInputProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-2"
    >
      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Globe className="h-4 w-4" />
        Target Host
      </label>
      <div className="relative">
        <Server className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={target}
          onChange={(e) => onChange(e.target.value)}
          placeholder="192.168.1.1 or example.com"
          disabled={isScanning}
          className="pl-10 font-mono bg-secondary/50 border-border focus:border-primary focus:ring-primary/20 h-12"
        />
        {target && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-success"
          />
        )}
      </div>
    </motion.div>
  );
}
