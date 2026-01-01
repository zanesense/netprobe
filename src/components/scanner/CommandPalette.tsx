import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Command as CommandIcon,
  Search,
  Play,
  Square,
  Download,
  FileText,
  Settings,
  Network,
  ScanLine,
  Fingerprint,
  FileCode,
  ShieldAlert,
  Trash2,
  History,
  HelpCircle,
  Globe,
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
}

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  category: string;
  shortcut?: string;
}

const COMMANDS: CommandItem[] = [
  // Scan Actions
  { id: "start-scan", label: "Start Scan", description: "Begin a new network scan", icon: <Play className="h-4 w-4" />, category: "Scan", shortcut: "⌘S" },
  { id: "stop-scan", label: "Stop Scan", description: "Abort current scan", icon: <Square className="h-4 w-4" />, category: "Scan", shortcut: "⌘Q" },
  { id: "quick-scan", label: "Quick Scan", description: "Fast scan of top 100 ports", icon: <ScanLine className="h-4 w-4" />, category: "Scan" },
  { id: "full-scan", label: "Full Scan", description: "Comprehensive scan all ports", icon: <Network className="h-4 w-4" />, category: "Scan" },
  
  // Navigation
  { id: "nav-discovery", label: "Go to Discovery", icon: <Network className="h-4 w-4" />, category: "Navigate" },
  { id: "nav-resolver", label: "Go to DNS Resolver", icon: <Globe className="h-4 w-4" />, category: "Navigate" },
  { id: "nav-ports", label: "Go to Port Scan", icon: <ScanLine className="h-4 w-4" />, category: "Navigate" },
  { id: "nav-services", label: "Go to Services", icon: <Search className="h-4 w-4" />, category: "Navigate" },
  { id: "nav-fingerprint", label: "Go to OS Detection", icon: <Fingerprint className="h-4 w-4" />, category: "Navigate" },
  { id: "nav-scripts", label: "Go to Scripts", icon: <FileCode className="h-4 w-4" />, category: "Navigate" },
  { id: "nav-firewall", label: "Go to Firewall", icon: <ShieldAlert className="h-4 w-4" />, category: "Navigate" },
  { id: "nav-reports", label: "Go to Reports", icon: <FileText className="h-4 w-4" />, category: "Navigate" },
  
  // Export
  { id: "export-json", label: "Export as JSON", icon: <Download className="h-4 w-4" />, category: "Export" },
  { id: "export-csv", label: "Export as CSV", icon: <Download className="h-4 w-4" />, category: "Export" },
  { id: "export-pdf", label: "Export as PDF", icon: <FileText className="h-4 w-4" />, category: "Export" },
  
  // Other
  { id: "clear-history", label: "Clear History", icon: <Trash2 className="h-4 w-4" />, category: "Data" },
  { id: "view-history", label: "View History", icon: <History className="h-4 w-4" />, category: "Data" },
  { id: "settings", label: "Settings", icon: <Settings className="h-4 w-4" />, category: "App", shortcut: "⌘," },
  { id: "help", label: "Help & Documentation", icon: <HelpCircle className="h-4 w-4" />, category: "App", shortcut: "?" },
];

export function CommandPalette({ isOpen, onClose, onAction }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredCommands = COMMANDS.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase()) ||
    (cmd.description?.toLowerCase().includes(query.toLowerCase()))
  );

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          onAction(filteredCommands[selectedIndex].id);
          onClose();
        }
        break;
      case "Escape":
        e.preventDefault();
        onClose();
        break;
    }
  }, [isOpen, filteredCommands, selectedIndex, onAction, onClose]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] p-4 bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-xl rounded-xl bg-card border border-border shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search className="h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search commands..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none"
                autoFocus
              />
              <kbd className="px-2 py-1 text-xs bg-secondary rounded border border-border text-muted-foreground">
                ESC
              </kbd>
            </div>

            {/* Command List */}
            <div className="max-h-[400px] overflow-y-auto p-2">
              {Object.entries(groupedCommands).map(([category, commands]) => (
                <div key={category} className="mb-4 last:mb-0">
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {category}
                  </div>
                  {commands.map((cmd) => {
                    const globalIndex = filteredCommands.indexOf(cmd);
                    const isSelected = globalIndex === selectedIndex;

                    return (
                      <button
                        key={cmd.id}
                        onClick={() => {
                          onAction(cmd.id);
                          onClose();
                        }}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                          ${isSelected ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-secondary/50"}
                        `}
                      >
                        <div className={isSelected ? "text-primary" : "text-muted-foreground"}>
                          {cmd.icon}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium">{cmd.label}</div>
                          {cmd.description && (
                            <div className="text-xs text-muted-foreground">{cmd.description}</div>
                          )}
                        </div>
                        {cmd.shortcut && (
                          <kbd className="px-1.5 py-0.5 text-xs bg-secondary rounded border border-border text-muted-foreground">
                            {cmd.shortcut}
                          </kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}

              {filteredCommands.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  <CommandIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No commands found</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
