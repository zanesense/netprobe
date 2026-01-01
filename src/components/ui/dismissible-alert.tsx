import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DismissibleAlertProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  variant?: "default" | "destructive";
  persistDismissal?: boolean;
  onDismiss?: () => void;
}

export function DismissibleAlert({ 
  id, 
  children, 
  className,
  title,
  description,
  icon,
  variant = "default",
  persistDismissal = true,
  onDismiss
}: DismissibleAlertProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (persistDismissal) {
      const dismissed = localStorage.getItem(`netprobe-alert-dismissed-${id}`);
      if (dismissed === 'true') {
        setIsDismissed(true);
      }
    }
  }, [id, persistDismissal]);

  const handleDismiss = () => {
    setIsDismissed(true);
    
    if (persistDismissal) {
      localStorage.setItem(`netprobe-alert-dismissed-${id}`, 'true');
    }
    
    onDismiss?.();
  };

  if (isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
        animate={{ opacity: 1, height: "auto", marginBottom: "1rem" }}
        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        style={{ overflow: "hidden" }}
      >
        <Alert className={cn(className)} variant={variant}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2 flex-1">
              {icon && <div className="mt-0.5">{icon}</div>}
              <div className="flex-1">
                {title && <AlertTitle className="mb-1">{title}</AlertTitle>}
                {description && <AlertDescription>{description}</AlertDescription>}
                {children}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0 ml-2 hover:bg-transparent opacity-70 hover:opacity-100 shrink-0"
              aria-label="Dismiss alert"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </Alert>
      </motion.div>
    </AnimatePresence>
  );
}

// Utility function to reset all dismissed alerts
export function resetDismissedAlerts() {
  const keys = Object.keys(localStorage).filter(key => 
    key.startsWith('netprobe-alert-dismissed-')
  );
  
  keys.forEach(key => {
    localStorage.removeItem(key);
  });
}

// Utility function to check if an alert is dismissed
export function isAlertDismissed(id: string): boolean {
  return localStorage.getItem(`netprobe-alert-dismissed-${id}`) === 'true';
}

// Utility function to dismiss an alert programmatically
export function dismissAlert(id: string) {
  localStorage.setItem(`netprobe-alert-dismissed-${id}`, 'true');
}