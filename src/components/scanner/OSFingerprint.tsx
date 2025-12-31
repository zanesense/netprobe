import { motion } from "framer-motion";
import { 
  Fingerprint, 
  Monitor, 
  Server, 
  Smartphone, 
  Router,
  Cpu,
  HardDrive,
  Network,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { OSInfo, Host } from "@/types/scanner";

interface OSFingerprintProps {
  hosts: Host[];
  isScanning: boolean;
  onFingerprintOS: () => void;
}

const DEVICE_ICONS: Record<string, React.ElementType> = {
  workstation: Monitor,
  server: Server,
  mobile: Smartphone,
  router: Router,
  iot: Cpu,
  storage: HardDrive,
  default: Network,
};

const OS_COLORS: Record<string, string> = {
  windows: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  linux: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  macos: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  freebsd: "bg-red-500/20 text-red-400 border-red-500/30",
  unknown: "bg-muted text-muted-foreground border-border",
};

export function OSFingerprint({ hosts, isScanning, onFingerprintOS }: OSFingerprintProps) {
  const hostsWithOS = hosts.filter(h => h.osInfo);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">OS & Device Fingerprinting</h2>
          <p className="text-sm text-muted-foreground">
            TTL analysis and pattern matching
          </p>
        </div>
        <Button onClick={onFingerprintOS} disabled={isScanning}>
          <Fingerprint className="h-4 w-4 mr-2" />
          {isScanning ? "Analyzing..." : "Fingerprint Hosts"}
        </Button>
      </div>

      {hostsWithOS.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Fingerprint className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium">No OS Data Available</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Discover hosts first, then run OS fingerprinting
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {hostsWithOS.map((host, index) => {
            const osInfo = host.osInfo!;
            const DeviceIcon = DEVICE_ICONS[osInfo.deviceType || "default"] || DEVICE_ICONS.default;
            const osFamily = osInfo.name.toLowerCase().includes("windows") ? "windows" 
              : osInfo.name.toLowerCase().includes("linux") ? "linux"
              : osInfo.name.toLowerCase().includes("mac") ? "macos"
              : osInfo.name.toLowerCase().includes("bsd") ? "freebsd"
              : "unknown";

            return (
              <motion.div
                key={host.ip}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-primary/10">
                          <DeviceIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-mono">{host.ip}</CardTitle>
                          {host.hostname && (
                            <p className="text-xs text-muted-foreground">{host.hostname}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className={OS_COLORS[osFamily]}>
                        {osInfo.name}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Confidence</span>
                        <span className="font-mono">{osInfo.accuracy}%</span>
                      </div>
                      <Progress value={osInfo.accuracy} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">TTL</span>
                        <p className="font-mono">{osInfo.ttl}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Window Size</span>
                        <p className="font-mono">{osInfo.windowSize}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Device Type</span>
                        <p className="capitalize">{osInfo.deviceType}</p>
                      </div>
                      {osInfo.vendor && (
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground">Vendor</span>
                          <p>{osInfo.vendor}</p>
                        </div>
                      )}
                    </div>

                    {osInfo.cpe && (
                      <div className="pt-2 border-t border-border">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <Info className="h-3 w-3" />
                          <span>CPE</span>
                        </div>
                        <code className="text-xs font-mono text-foreground/80 break-all">
                          {osInfo.cpe}
                        </code>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
