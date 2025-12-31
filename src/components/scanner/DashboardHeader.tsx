import { motion, AnimatePresence } from "framer-motion";
import { 
  Radar, 
  Terminal, 
  Shield, 
  Network,
  Search,
  ScanLine,
  Fingerprint,
  FileCode,
  ShieldAlert,
  FileText,
  Settings,
  Command,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScanPhase } from "@/types/scanner";

interface DashboardHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentPhase: ScanPhase;
  onOpenCommandPalette: () => void;
}

const TABS = [
  { id: "discovery", label: "Discovery", icon: Network },
  { id: "ports", label: "Port Scan", icon: ScanLine },
  { id: "services", label: "Services", icon: Search },
  { id: "fingerprint", label: "OS/Device", icon: Fingerprint },
  { id: "scripts", label: "Scripts", icon: FileCode },
  { id: "firewall", label: "Firewall", icon: ShieldAlert },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
];

const PHASE_LABELS: Record<ScanPhase, string> = {
  idle: "Ready",
  discovery: "Host Discovery",
  scanning: "Port Scanning",
  detection: "Service Detection",
  analysis: "Analysis",
  complete: "Complete",
};

export function DashboardHeader({ activeTab, onTabChange, currentPhase, onOpenCommandPalette }: DashboardHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40"
    >
      <div className="container mx-auto px-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between py-4">
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
                <span className="text-muted-foreground ml-2 text-sm font-normal">Pro</span>
              </h1>
              <p className="text-xs text-muted-foreground font-mono">
                Network Security Assessment Tool
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Command Palette Trigger */}
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenCommandPalette}
              className="hidden md:flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Command className="h-3.5 w-3.5" />
              <span className="text-xs">Quick Actions</span>
              <kbd className="ml-2 px-1.5 py-0.5 text-[10px] bg-secondary rounded border border-border">
                ⌘K
              </kbd>
            </Button>

            {/* Phase Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary border border-border">
              {currentPhase !== "idle" && currentPhase !== "complete" ? (
                <motion.div
                  className="h-2 w-2 rounded-full bg-primary"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              ) : (
                <div className={`h-2 w-2 rounded-full ${currentPhase === "complete" ? "bg-success" : "bg-muted-foreground"}`} />
              )}
              <span className="text-xs font-mono text-muted-foreground">
                {PHASE_LABELS[currentPhase]}
              </span>
            </div>

            {/* Version Badge */}
            <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <Terminal className="h-3.5 w-3.5" />
              <span>v3.0.0</span>
            </div>

            {/* Security Mode */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-success/10 border border-success/30">
              <Shield className="h-3.5 w-3.5 text-success" />
              <span className="text-xs font-mono text-success">
                Safe Mode
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center gap-1 -mb-px overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors
                  ${isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </motion.header>
  );
}
