import { motion } from "framer-motion";
import { Radar, Terminal, Shield } from "lucide-react";

export function ScannerHeader() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="border-b border-border bg-card/50 backdrop-blur-sm"
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Radar className="h-8 w-8 text-primary" />
              <motion.div
                className="absolute inset-0 rounded-full bg-primary/20"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                <span className="text-primary text-glow">Net</span>
                <span className="text-foreground">Probe</span>
              </h1>
              <p className="text-xs text-muted-foreground font-mono">
                Advanced Port Scanner
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <Terminal className="h-3.5 w-3.5" />
              <span>v2.0.0</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary border border-border">
              <Shield className="h-3.5 w-3.5 text-success" />
              <span className="text-xs font-mono text-muted-foreground">
                Secure Mode
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
