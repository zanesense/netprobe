import { motion } from "framer-motion";
import { Wifi, Zap, Radio, Eye } from "lucide-react";

interface ScanTypeSelectorProps {
  scanType: string;
  onChange: (type: string) => void;
  isScanning: boolean;
}

const SCAN_TYPES = [
  { id: "tcp", label: "TCP Connect", icon: Wifi, description: "Full TCP handshake" },
  { id: "syn", label: "SYN Stealth", icon: Zap, description: "Half-open scan" },
  { id: "udp", label: "UDP Scan", icon: Radio, description: "Connectionless probe" },
  { id: "service", label: "Service Detection", icon: Eye, description: "Banner grabbing" },
];

export function ScanTypeSelector({ scanType, onChange, isScanning }: ScanTypeSelectorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-3"
    >
      <label className="text-sm font-medium text-muted-foreground">
        Scan Type
      </label>

      <div className="grid grid-cols-2 gap-2">
        {SCAN_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = scanType === type.id;
          
          return (
            <motion.button
              key={type.id}
              onClick={() => !isScanning && onChange(type.id)}
              disabled={isScanning}
              whileHover={{ scale: isScanning ? 1 : 1.02 }}
              whileTap={{ scale: isScanning ? 1 : 0.98 }}
              className={`
                relative p-3 rounded-lg border transition-all duration-200 text-left
                ${isSelected 
                  ? "border-primary bg-primary/10 glow-primary" 
                  : "border-border bg-secondary/30 hover:border-muted-foreground/30"
                }
                ${isScanning ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              <div className="flex items-start gap-2">
                <Icon className={`h-4 w-4 mt-0.5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                <div>
                  <div className={`text-sm font-medium ${isSelected ? "text-primary" : "text-foreground"}`}>
                    {type.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {type.description}
                  </div>
                </div>
              </div>
              {isSelected && (
                <motion.div
                  layoutId="scan-type-indicator"
                  className="absolute inset-0 rounded-lg border-2 border-primary"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
