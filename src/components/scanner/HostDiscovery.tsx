import { useState } from "react";
import { motion } from "framer-motion";
import { Network, Wifi, Radio, Server, Router, Laptop, HardDrive, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { DiscoveredHost, DiscoveryMethod } from "@/types/scanner";
import { DISCOVERY_METHODS } from "@/lib/scanner-utils";

interface HostDiscoveryProps {
  isScanning: boolean;
  hosts: DiscoveredHost[];
  onStartDiscovery: (target: string, methods: DiscoveryMethod[]) => void;
  onStopDiscovery: () => void;
}

const DEVICE_ICONS: Record<string, React.ElementType> = {
  server: Server,
  router: Router,
  workstation: Laptop,
  unknown: HardDrive,
};

export function HostDiscovery({ isScanning, hosts, onStartDiscovery, onStopDiscovery }: HostDiscoveryProps) {
  const [target, setTarget] = useState("192.168.1.0/24");
  const [selectedMethods, setSelectedMethods] = useState<DiscoveryMethod[]>(["icmp-echo", "tcp-syn", "arp"]);

  const toggleMethod = (method: DiscoveryMethod) => {
    setSelectedMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
  };

  const handleStart = () => {
    if (target.trim() && selectedMethods.length > 0) {
      onStartDiscovery(target, selectedMethods);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-xl bg-card border border-border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Network className="h-5 w-5 text-primary" />
          Host Discovery
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Target Network</label>
            <Input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="192.168.1.0/24 or IP range" disabled={isScanning} className="font-mono" />
            <p className="text-xs text-muted-foreground mt-2">Supports CIDR notation, IP ranges, or single IPs</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Discovery Methods</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(DISCOVERY_METHODS) as [DiscoveryMethod, { name: string; description: string }][]).map(([method, info]) => (
                <label key={method} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${selectedMethods.includes(method) ? "bg-primary/10 border-primary/30" : "bg-secondary/30 border-border hover:bg-secondary/50"}`} onClick={() => !isScanning && toggleMethod(method)}>
                  <Checkbox checked={selectedMethods.includes(method)} disabled={isScanning} />
                  <span className="text-xs font-medium">{info.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border flex justify-end">
          {isScanning ? (
            <Button variant="destructive" onClick={onStopDiscovery}>Stop Discovery</Button>
          ) : (
            <Button variant="scan" onClick={handleStart} disabled={!target.trim() || selectedMethods.length === 0}>
              <Wifi className="h-4 w-4 mr-2" />
              Start Discovery
            </Button>
          )}
        </div>
      </motion.div>

      {/* Results */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-6 rounded-xl bg-card border border-border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Discovered Hosts ({hosts.length})
        </h3>

        {hosts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Radio className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No hosts discovered yet</p>
            <p className="text-xs mt-1">Configure target and start discovery</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {hosts.map((host) => {
              const DeviceIcon = DEVICE_ICONS[host.vendor?.toLowerCase().includes("cisco") ? "router" : "server"] || DEVICE_ICONS.unknown;
              return (
                <motion.div key={host.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 border border-border hover:border-primary/30 transition-colors">
                  <div className="p-2 rounded-lg bg-success/10 border border-success/30">
                    <DeviceIcon className="h-5 w-5 text-success" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm text-foreground">{host.ip}</div>
                    <div className="text-xs text-muted-foreground">{host.hostname || host.mac || "Unknown"} • {host.vendor || "Unknown Vendor"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">TTL: {host.ttl}</div>
                    <div className="text-xs text-success">{host.latency}ms</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
