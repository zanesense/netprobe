import { motion } from "framer-motion";
import { AlertTriangle, Info, Shield, Zap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function BrowserLimitations() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 mb-6"
    >
      <Alert className="border-warning/30 bg-warning/10">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <AlertDescription className="text-sm">
          <strong>Browser Security Limitations:</strong> Due to browser security policies, 
          some scanning features are limited compared to native tools like Nmap.
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-success" />
            <h4 className="font-medium text-success">Available Features</h4>
          </div>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• HTTP/HTTPS port detection</li>
            <li>• WebSocket connection testing</li>
            <li>• Service banner grabbing (HTTP)</li>
            <li>• Basic host reachability</li>
            <li>• Connection timing analysis</li>
          </ul>
        </div>

        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-primary" />
            <h4 className="font-medium text-primary">Limited Features</h4>
          </div>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Raw socket access (SYN/ACK scans)</li>
            <li>• ICMP ping and traceroute</li>
            <li>• UDP port scanning</li>
            <li>• OS fingerprinting via TCP/IP</li>
            <li>• Network interface enumeration</li>
          </ul>
        </div>
      </div>

      <Alert className="border-primary/30 bg-primary/10">
        <Zap className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm">
          <strong>For Advanced Scanning:</strong> Consider using native tools like Nmap, 
          Masscan, or Zmap for comprehensive network reconnaissance and security testing.
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}