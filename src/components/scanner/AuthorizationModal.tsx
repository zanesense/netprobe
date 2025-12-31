import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface AuthorizationModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function AuthorizationModal({ isOpen, onAccept, onDecline }: AuthorizationModalProps) {
  const [checks, setChecks] = useState({
    authorized: false,
    understand: false,
    educational: false,
  });

  const allChecked = Object.values(checks).every(Boolean);

  const handleCheck = (key: keyof typeof checks) => {
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-2xl rounded-xl bg-card border border-border shadow-2xl flex flex-col max-h-[90vh] my-auto"
          >
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-border bg-gradient-to-r from-warning/10 to-destructive/10 shrink-0">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 rounded-full bg-warning/20 border border-warning/30">
                  <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-warning" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                    Authorization Required
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Network security scanning requires explicit authorization
                  </p>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Warning Box */}
              <div className="p-3 sm:p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                <div className="flex items-start gap-2 sm:gap-3">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm">
                    <p className="font-medium text-destructive mb-1 sm:mb-2">
                      Important Legal Notice
                    </p>
                    <p className="text-muted-foreground">
                      Unauthorized network scanning is illegal in most jurisdictions. 
                      Only use this tool on networks and systems you own or have 
                      explicit written permission to test.
                    </p>
                  </div>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3 sm:space-y-4">
                <label 
                  className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-secondary/30 border border-border cursor-pointer hover:bg-secondary/50 transition-colors"
                  onClick={() => handleCheck("authorized")}
                >
                  <Checkbox 
                    checked={checks.authorized} 
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      I am authorized to scan the target network
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                      I own the network/systems or have explicit written permission from the owner
                    </p>
                  </div>
                </label>

                <label 
                  className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-secondary/30 border border-border cursor-pointer hover:bg-secondary/50 transition-colors"
                  onClick={() => handleCheck("understand")}
                >
                  <Checkbox 
                    checked={checks.understand} 
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      I understand the potential impact
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                      Network scanning may trigger security alerts, affect network performance, 
                      or be logged by security systems
                    </p>
                  </div>
                </label>

                <label 
                  className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-secondary/30 border border-border cursor-pointer hover:bg-secondary/50 transition-colors"
                  onClick={() => handleCheck("educational")}
                >
                  <Checkbox 
                    checked={checks.educational} 
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      This is for educational/authorized purposes only
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                      I will not use this tool for malicious activities or unauthorized access
                    </p>
                  </div>
                </label>
              </div>

              {/* Info Box */}
              <div className="p-3 sm:p-4 rounded-lg bg-primary/10 border border-primary/30">
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm">
                    <p className="font-medium text-primary mb-1 sm:mb-2">
                      Safe by Design
                    </p>
                    <p className="text-muted-foreground">
                      This tool operates in passive/read-only mode by default. It does not 
                      perform exploitation, denial-of-service, or destructive operations. 
                      All scans are logged locally for audit purposes.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-6 border-t border-border bg-secondary/20 shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
              <a 
                href="https://en.wikipedia.org/wiki/Computer_Fraud_and_Abuse_Act" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs sm:text-sm text-muted-foreground hover:text-primary flex items-center justify-center sm:justify-start gap-1.5 transition-colors"
              >
                <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                Learn about computer laws
              </a>
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={onDecline} className="flex-1 sm:flex-none">
                  Decline
                </Button>
                <Button 
                  variant="scan" 
                  disabled={!allChecked}
                  onClick={onAccept}
                  className="flex-1 sm:flex-none sm:min-w-[140px]"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  I Understand
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
