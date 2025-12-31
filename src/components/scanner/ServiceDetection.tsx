import { motion } from "framer-motion";
import { 
  Search, 
  Globe, 
  Lock, 
  Server, 
  Mail, 
  Database,
  FileText,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ServiceInfo } from "@/types/scanner";

interface ServiceDetectionProps {
  services: ServiceInfo[];
  isScanning: boolean;
  onDetectServices: () => void;
}

const SERVICE_ICONS: Record<string, React.ElementType> = {
  http: Globe,
  https: Lock,
  ssh: Server,
  ftp: FileText,
  smtp: Mail,
  dns: Database,
  default: Server,
};

export function ServiceDetection({ services, isScanning, onDetectServices }: ServiceDetectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Service & Version Detection</h2>
          <p className="text-sm text-muted-foreground">
            Banner grabbing and protocol identification
          </p>
        </div>
        <Button onClick={onDetectServices} disabled={isScanning}>
          <Search className="h-4 w-4 mr-2" />
          {isScanning ? "Detecting..." : "Detect Services"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium">No Services Detected</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Run a port scan first, then detect services on open ports
              </p>
            </CardContent>
          </Card>
        ) : (
          services.map((service, index) => {
            const IconComponent = SERVICE_ICONS[service.name.toLowerCase()] || SERVICE_ICONS.default;
            
            return (
              <motion.div
                key={`${service.port}-${index}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-md bg-primary/10">
                          <IconComponent className="h-4 w-4 text-primary" />
                        </div>
                        <CardTitle className="text-base">{service.name}</CardTitle>
                      </div>
                      <Badge variant="outline" className="font-mono">
                        :{service.port}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {service.version && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Version:</span>
                        <code className="px-1.5 py-0.5 rounded bg-secondary text-xs">
                          {service.version}
                        </code>
                      </div>
                    )}
                    {service.product && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Product:</span>
                        <span>{service.product}</span>
                      </div>
                    )}
                    {service.banner && (
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Banner:</span>
                        <ScrollArea className="h-16 rounded bg-secondary/50 p-2">
                          <code className="text-xs font-mono break-all">
                            {service.banner}
                          </code>
                        </ScrollArea>
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      {service.secure ? (
                        <div className="flex items-center gap-1 text-xs text-success">
                          <Shield className="h-3 w-3" />
                          <span>Encrypted</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-warning">
                          <AlertCircle className="h-3 w-3" />
                          <span>Unencrypted</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
