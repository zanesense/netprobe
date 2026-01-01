import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Globe, 
  ArrowRight, 
  Copy, 
  Check, 
  Loader2, 
  AlertCircle,
  RefreshCw,
  MapPin,
  Clock,
  Server,
  Zap,
  Network
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DismissibleAlert } from "@/components/ui/dismissible-alert";
import { toast } from "sonner";
import { HostnameResolver as Resolver, ResolverResult } from "@/lib/hostname-resolver";

export function HostnameResolver() {
  const [hostname, setHostname] = useState("");
  const [isResolving, setIsResolving] = useState(false);
  const [results, setResults] = useState<ResolverResult[]>([]);
  const [copiedIP, setCopiedIP] = useState<string | null>(null);

  const handleResolve = async () => {
    if (!hostname.trim()) {
      toast.error("Please enter a hostname");
      return;
    }

    setIsResolving(true);
    
    try {
      const result = await Resolver.resolve(hostname);
      setResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
      
      if (result.error) {
        toast.error(`Resolution failed: ${result.error}`);
      } else {
        toast.success(`Resolved ${result.records.length} record(s) for ${result.hostname}`);
      }
    } catch (error) {
      toast.error("Resolution failed");
    } finally {
      setIsResolving(false);
    }
  };

  const handleCopyIP = async (ip: string) => {
    try {
      await navigator.clipboard.writeText(ip);
      setCopiedIP(ip);
      toast.success("IP address copied to clipboard");
      setTimeout(() => setCopiedIP(null), 2000);
    } catch (error) {
      toast.error("Failed to copy IP address");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isResolving) {
      handleResolve();
    }
  };

  const clearResults = () => {
    setResults([]);
    toast.info("Results cleared");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Hostname to IP Resolver
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Resolve domain names to IP addresses using DNS lookup
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter hostname (e.g., google.com, github.com)"
              value={hostname}
              onChange={(e) => setHostname(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isResolving}
              className="flex-1"
            />
            <Button 
              onClick={handleResolve} 
              disabled={isResolving || !hostname.trim()}
              className="min-w-[100px]"
            >
              {isResolving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Resolve
                </>
              )}
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHostname("google.com")}
              disabled={isResolving}
            >
              <Zap className="h-3 w-3 mr-1" />
              Google
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHostname("github.com")}
              disabled={isResolving}
            >
              <Zap className="h-3 w-3 mr-1" />
              GitHub
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHostname("cloudflare.com")}
              disabled={isResolving}
            >
              <Zap className="h-3 w-3 mr-1" />
              Cloudflare
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHostname("stackoverflow.com")}
              disabled={isResolving}
            >
              <Zap className="h-3 w-3 mr-1" />
              Stack Overflow
            </Button>
          </div>

          {results.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {results.length} resolution result(s)
              </p>
              <Button variant="ghost" size="sm" onClick={clearResults}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        {results.map((result, index) => (
          <motion.div
            key={`${result.hostname}-${result.timestamp.getTime()}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-primary" />
                      <span className="font-mono font-medium">{result.hostname}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {result.timestamp.toLocaleTimeString()}
                      <span>•</span>
                      <span>{result.totalTime}ms</span>
                      {result.methods && result.methods.length > 0 && (
                        <>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs">
                            {result.methods.length} method{result.methods.length > 1 ? 's' : ''}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Error State */}
                  {result.error && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <span className="text-sm text-destructive">{result.error}</span>
                    </div>
                  )}

                  {/* DNS Records */}
                  {result.records.length > 0 && (
                    <div className="space-y-3">
                      {result.records.map((record, recordIndex) => (
                        <div
                          key={recordIndex}
                          className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border"
                        >
                          <div className="flex items-center gap-3">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                record.recordType === 'A' ? 'border-green-500 text-green-700 dark:text-green-400' :
                                record.recordType === 'AAAA' ? 'border-blue-500 text-blue-700 dark:text-blue-400' :
                                record.recordType === 'CNAME' ? 'border-yellow-500 text-yellow-700 dark:text-yellow-400' :
                                record.recordType === 'MX' ? 'border-purple-500 text-purple-700 dark:text-purple-400' :
                                'border-gray-500 text-gray-700 dark:text-gray-400'
                              }`}
                            >
                              {record.recordType}
                            </Badge>
                            <div>
                              <p className="font-mono text-sm font-medium">
                                {record.ipAddress}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {record.ttl && (
                                  <span>TTL: {record.ttl}s</span>
                                )}
                                {record.priority && (
                                  <>
                                    {record.ttl && <span>•</span>}
                                    <span>Priority: {record.priority}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {record.responseTime}ms
                            </span>
                            <div className="flex items-center gap-1">
                              {record.ipAddress.match(/^\d+\.\d+\.\d+\.\d+$/) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopyIP(record.ipAddress)}
                                  className="h-8 w-8 p-0"
                                  title="Copy IP address"
                                >
                                  {copiedIP === record.ipAddress ? (
                                    <Check className="h-3 w-3 text-success" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              )}
                              {(record.ipAddress.match(/^\d+\.\d+\.\d+\.\d+$/) || result.hostname) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    // Navigate to port scanner with this target
                                    const target = record.ipAddress.match(/^\d+\.\d+\.\d+\.\d+$/) 
                                      ? record.ipAddress 
                                      : result.hostname;
                                    
                                    // This would need to be passed as a prop or use a context
                                    // For now, we'll just copy to clipboard and show a message
                                    navigator.clipboard.writeText(target);
                                    toast.success(`Target "${target}" copied! Switch to Port Scan tab to use it.`);
                                  }}
                                  className="h-8 w-8 p-0"
                                  title="Use in port scanner"
                                >
                                  <Network className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Info Card */}
      <DismissibleAlert
        id="hostname-resolver-limitations"
        className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20"
        icon={<MapPin className="h-5 w-5 text-blue-500" />}
        title="Browser Limitations"
        description="Due to browser security policies, direct IP resolution is limited. This tool uses multiple methods including public DNS APIs and connectivity tests to provide hostname resolution information."
      >
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant="secondary" className="text-xs">
            DNS API Resolution
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Connectivity Testing
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Browser Resolution
          </Badge>
        </div>
      </DismissibleAlert>
    </motion.div>
  );
}