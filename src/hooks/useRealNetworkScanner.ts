import { useState, useCallback, useRef } from "react";
import { DiscoveredHost, PortResult, LogEntry, ScanPhase, DiscoveryMethod, ScanHistoryEntry, ServiceInfo, Host, ScriptResult, FirewallInfo } from "@/types/scanner";
import { networkScanner, PortScanResult, HostDiscoveryResult } from "@/lib/network-scanner";
import { OSFingerprintEngine, OSFingerprint } from "@/lib/os-fingerprinting";
import { AdvancedServiceDetector, DetectedService } from "@/lib/advanced-service-detection";
import { ScriptEngine, SecurityScript, SECURITY_SCRIPTS } from "@/lib/script-engine";
import { FirewallDetector, FirewallAnalysis } from "@/lib/firewall-detection";
import { generateId, parseTarget } from "@/lib/scanner-utils";

export function useRealNetworkScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [currentPort, setCurrentPort] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [discoveredHosts, setDiscoveredHosts] = useState<DiscoveredHost[]>([]);
  const [portResults, setPortResults] = useState<PortResult[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [history, setHistory] = useState<ScanHistoryEntry[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const addLog = useCallback((message: string, level: LogEntry["level"] = "info") => {
    setLogs((prev) => [...prev, { 
      id: generateId(), 
      timestamp: new Date(), 
      level, 
      message 
    }]);
  }, []);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const realHostDiscovery = useCallback(async (target: string, methods: DiscoveryMethod[]) => {
    setIsScanning(true);
    setPhase("discovery");
    setProgress(0);
    setDiscoveredHosts([]);
    setLogs([]);
    
    startTimer();
    addLog(`Starting host discovery on ${target}`, "info");
    addLog(`Methods: ${methods.join(", ")}`, "info");

    try {
      const parsedTarget = parseTarget(target);
      if (!parsedTarget) {
        addLog("Invalid target format", "error");
        setIsScanning(false);
        setPhase("idle");
        stopTimer();
        return;
      }

      // For CIDR ranges, we'll scan multiple hosts
      // For single hosts, we'll just verify the target
      const hosts = await networkScanner.discoverHosts(target, methods);
      
      const discoveredHostsData: DiscoveredHost[] = hosts.map((host: HostDiscoveryResult) => ({
        id: generateId(),
        ip: host.ip,
        hostname: host.hostname,
        mac: host.mac,
        vendor: host.vendor,
        method: host.method as DiscoveryMethod,
        latency: host.latency,
        ttl: host.ttl,
        isAlive: host.isAlive,
        discoveredAt: host.timestamp,
      }));

      setDiscoveredHosts(discoveredHostsData);
      setProgress(100);
      
      if (discoveredHostsData.length > 0) {
        addLog(`Discovery complete: ${discoveredHostsData.length} hosts found`, "success");
      } else {
        addLog("No hosts discovered - target may be unreachable", "warning");
      }
      
      setPhase("complete");
    } catch (error) {
      addLog(`Discovery failed: ${error}`, "error");
      setPhase("idle");
    } finally {
      setIsScanning(false);
      stopTimer();
    }
  }, [addLog, startTimer, stopTimer]);

  const realPortScan = useCallback(async (target: string, startPort: number, endPort: number, scanType: string) => {
    setIsScanning(true);
    setPhase("scanning");
    setProgress(0);
    setPortResults([]);
    setLogs([]);
    setCurrentPort(startPort);
    
    startTimer();

    try {
      const parsedTarget = parseTarget(target);
      if (!parsedTarget) {
        addLog("Invalid target format", "error");
        setIsScanning(false);
        setPhase("idle");
        stopTimer();
        return;
      }

      const results: PortResult[] = [];
      
      await networkScanner.scanPorts({
        target,
        startPort,
        endPort,
        scanType: scanType as any,
        timeout: 3000,
        concurrency: 20,
        onProgress: (progress, currentPort) => {
          setProgress(progress);
          setCurrentPort(currentPort);
        },
        onResult: (result: PortScanResult) => {
          const portResult: PortResult = {
            port: result.port,
            protocol: result.protocol,
            status: result.status === 'timeout' ? 'filtered' : result.status,
            state: result.status === 'timeout' ? 'filtered' : result.status,
            service: result.service,
            version: result.version,
            latency: result.latency,
          };
          
          results.push(portResult);
          setPortResults([...results]);
        },
        onLog: (message, level) => {
          addLog(message, level);
        }
      });

      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const openPorts = results.filter(r => r.status === 'open').length;
      
      addLog(`Scan completed in ${duration}s`, "success");
      addLog(`Found ${openPorts} open ports out of ${endPort - startPort + 1} scanned`, "info");
      
      // Add to history
      const historyEntry: ScanHistoryEntry = {
        id: generateId(),
        target,
        targetType: parsedTarget.type,
        timestamp: new Date(),
        duration,
        hostsUp: 1,
        portsOpen: openPorts,
        findings: {
          info: 0,
          low: openPorts,
          medium: 0,
          high: 0,
          critical: 0
        },
        status: "completed"
      };
      
      setHistory(prev => [historyEntry, ...prev.slice(0, 9)]);
      setPhase("complete");
      
    } catch (error) {
      addLog(`Scan failed: ${error}`, "error");
      setPhase("idle");
    } finally {
      setIsScanning(false);
      stopTimer();
    }
  }, [addLog, startTimer, stopTimer]);

  const stopScan = useCallback(() => {
    networkScanner.stopScan();
    addLog("Scan stopped by user", "warning");
    setIsScanning(false);
    setPhase("idle");
    stopTimer();
  }, [addLog, stopTimer]);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  // Advanced service detection using real techniques
  const detectServices = useCallback(async (target: string) => {
    if (portResults.length === 0) {
      addLog("No open ports found for service detection", "warning");
      return [];
    }

    setPhase("detection");
    addLog("Starting advanced service detection...", "info");

    try {
      const openPorts = portResults
        .filter(r => r.status === 'open')
        .map(r => ({
          port: r.port,
          protocol: r.protocol,
          banner: r.version
        }));

      const detectedServices = await AdvancedServiceDetector.detectServices(target, openPorts);
      
      addLog(`Service detection complete: ${detectedServices.length} services identified`, "success");
      setPhase("complete");
      
      return detectedServices.map((service: DetectedService) => ({
        name: service.name,
        port: service.port,
        product: service.product,
        version: service.version,
        extraInfo: service.extraInfo,
        osType: service.osType,
        deviceType: service.deviceType,
        banner: service.banner,
        secure: service.secure,
        confidence: service.confidence,
        cpe: service.cpe,
      }));
    } catch (error) {
      addLog(`Service detection failed: ${error}`, "error");
      setPhase("complete");
      return [];
    }
  }, [portResults, addLog]);

  // OS fingerprinting using real techniques
  const fingerprintOS = useCallback(async (target: string) => {
    if (portResults.length === 0 && discoveredHosts.length === 0) {
      addLog("No scan data available for OS fingerprinting", "warning");
      return [];
    }

    setPhase("analysis");
    addLog("Starting OS fingerprinting...", "info");

    try {
      const openPorts = portResults
        .filter(r => r.status === 'open')
        .map(r => ({
          port: r.port,
          service: r.service,
          banner: r.version
        }));

      const fingerprints = await OSFingerprintEngine.fingerprintOS(
        target,
        openPorts,
        discoveredHosts
      );
      
      addLog(`OS fingerprinting complete: ${fingerprints.length} matches found`, "success");
      setPhase("complete");
      
      return fingerprints.map(fp => ({
        ip: target,
        hostname: target,
        status: 'up' as const,
        ports: portResults.filter(p => p.status === 'open'),
        osInfo: {
          name: fp.name,
          accuracy: fp.accuracy,
          ttl: discoveredHosts[0]?.ttl,
          windowSize: 65535, // Default value
          deviceType: fp.deviceType,
        },
      }));
    } catch (error) {
      addLog(`OS fingerprinting failed: ${error}`, "error");
      setPhase("complete");
      return [];
    }
  }, [portResults, discoveredHosts, addLog]);

  // Script scanning using real security scripts
  const runScripts = useCallback(async (scriptIds: string[], targetHost: string) => {
    if (portResults.length === 0) {
      addLog("No open ports found for script scanning", "warning");
      return [];
    }

    setPhase("analysis");
    addLog(`Starting script scan with ${scriptIds.length} scripts...`, "info");

    try {
      const openPorts = portResults
        .filter(r => r.status === 'open')
        .map(r => ({
          port: r.port,
          service: r.service
        }));

      const results = await ScriptEngine.runScripts(
        scriptIds,
        targetHost,
        openPorts,
        (completed, total) => {
          const progress = (completed / total) * 100;
          setProgress(progress);
          addLog(`Script progress: ${completed}/${total} completed`, "info");
        },
        (result) => {
          if (result.severity === 'high' || result.severity === 'critical') {
            addLog(`Security finding: ${result.name} - ${result.severity}`, "warning");
          }
        }
      );
      
      addLog(`Script scan complete: ${results.length} results`, "success");
      setPhase("complete");
      
      return results;
    } catch (error) {
      addLog(`Script scanning failed: ${error}`, "error");
      setPhase("complete");
      return [];
    }
  }, [portResults, addLog]);

  // Firewall detection using advanced techniques
  const analyzeFirewall = useCallback(async (target: string) => {
    if (portResults.length === 0) {
      addLog("No port scan data available for firewall analysis", "warning");
      return null;
    }

    setPhase("analysis");
    addLog("Starting firewall detection and analysis...", "info");

    try {
      const analysis = await FirewallDetector.analyzeFirewall(
        target,
        portResults,
        (progress) => {
          setProgress(progress);
        }
      );
      
      if (analysis.detected) {
        addLog(`Firewall detected: ${analysis.type} (${analysis.confidence}% confidence)`, "warning");
        analysis.indicators.forEach(indicator => {
          addLog(`Firewall indicator: ${indicator}`, "info");
        });
      } else {
        addLog("No firewall detected or firewall is transparent", "success");
      }
      
      setPhase("complete");
      return analysis;
    } catch (error) {
      addLog(`Firewall analysis failed: ${error}`, "error");
      setPhase("complete");
      return null;
    }
  }, [portResults, addLog]);

  // Get available security scripts
  const getAvailableScripts = useCallback(() => {
    return SECURITY_SCRIPTS;
  }, []);

  // Get scripts for specific ports
  const getScriptsForPorts = useCallback((openPorts: Array<{ port: number; service?: string }>) => {
    const applicableScripts: SecurityScript[] = [];
    
    for (const portInfo of openPorts) {
      const scripts = ScriptEngine.getScriptsForPort(portInfo.port, portInfo.service);
      scripts.forEach(script => {
        if (!applicableScripts.find(s => s.id === script.id)) {
          applicableScripts.push(script);
        }
      });
    }
    
    return applicableScripts;
  }, []);

  return {
    isScanning,
    phase,
    progress,
    currentPort,
    elapsedTime,
    discoveredHosts,
    portResults,
    logs,
    history,
    realHostDiscovery,
    realPortScan,
    stopScan,
    clearHistory,
    detectServices,
    fingerprintOS,
    runScripts,
    analyzeFirewall,
    getAvailableScripts,
    getScriptsForPorts,
  };
}