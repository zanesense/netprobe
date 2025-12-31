import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Square, Radar } from "lucide-react";
import { DashboardHeader } from "@/components/scanner/DashboardHeader";
import { AuthorizationModal } from "@/components/scanner/AuthorizationModal";
import { CommandPalette } from "@/components/scanner/CommandPalette";
import { BrowserLimitations } from "@/components/scanner/BrowserLimitations";
import { HostDiscovery } from "@/components/scanner/HostDiscovery";
import { TargetInput } from "@/components/scanner/TargetInput";
import { PortRangeSelector } from "@/components/scanner/PortRangeSelector";
import { ScanTypeSelector } from "@/components/scanner/ScanTypeSelector";
import { ScanProgress } from "@/components/scanner/ScanProgress";
import { ScanResults } from "@/components/scanner/ScanResults";
import { ScanHistory } from "@/components/scanner/ScanHistory";
import { TerminalOutput } from "@/components/scanner/TerminalOutput";
import { ServiceDetection } from "@/components/scanner/ServiceDetection";
import { OSFingerprint } from "@/components/scanner/OSFingerprint";
import { ScriptRunner } from "@/components/scanner/ScriptRunner";
import { FirewallDetection } from "@/components/scanner/FirewallDetection";
import { ReportsPanel } from "@/components/scanner/ReportsPanel";
import { Settings, AppSettings } from "@/components/scanner/Settings";
import { Button } from "@/components/ui/button";
import { useRealNetworkScanner } from "@/hooks/useRealNetworkScanner";
import { toast } from "sonner";
import { ServiceInfo, Host, ScriptResult, FirewallInfo, ScanResult } from "@/types/scanner";

const Index = () => {
  const [authorized, setAuthorized] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [activeTab, setActiveTab] = useState("discovery");
  const [target, setTarget] = useState("");
  const [startPort, setStartPort] = useState(1);
  const [endPort, setEndPort] = useState(1000);
  const [scanType, setScanType] = useState("tcp-connect");
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  
  // Module-specific states
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [scriptResults, setScriptResults] = useState<ScriptResult[]>([]);
  const [firewallInfo, setFirewallInfo] = useState<FirewallInfo | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  const { isScanning, phase, progress, currentPort, elapsedTime, discoveredHosts, portResults, logs, history, realHostDiscovery, realPortScan, stopScan, clearHistory, detectServices, fingerprintOS, runScripts, analyzeFirewall, getAvailableScripts, getScriptsForPorts } = useRealNetworkScanner();

  // Check compliance status on mount
  useEffect(() => {
    const complianceAccepted = localStorage.getItem('netprobe-compliance-accepted');
    const savedSettings = localStorage.getItem('netprobe-settings');
    
    let shouldShowModal = true;
    
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setAppSettings(settings);
        // If user has disabled compliance notice in settings, don't show it
        if (settings.showComplianceNotice === false) {
          shouldShowModal = false;
        }
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
    
    // If compliance was previously accepted and settings allow it, skip modal
    if (complianceAccepted === 'true' && !shouldShowModal) {
      setAuthorized(true);
      setShowAuthModal(false);
    } else if (complianceAccepted === 'true' && (!appSettings || appSettings.requireReauthorization !== true)) {
      setAuthorized(true);
      setShowAuthModal(false);
    } else {
      setShowAuthModal(true);
    }
  }, [appSettings]);

  const handleComplianceAccept = () => {
    localStorage.setItem('netprobe-compliance-accepted', 'true');
    setAuthorized(true);
    setShowAuthModal(false);
    toast.success("Authorization granted - Welcome to NetProbe");
  };

  const handleSettingsChange = (settings: AppSettings) => {
    setAppSettings(settings);
    // Apply settings to current scan configuration
    setScanType(settings.defaultScanType);
  };

  // Keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCommandPalette(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleCommandAction = useCallback((action: string) => {
    if (action.startsWith("nav-")) {
      setActiveTab(action.replace("nav-", ""));
    } else if (action === "start-scan") {
      if (target.trim()) realPortScan(target, startPort, endPort, scanType);
    } else if (action === "stop-scan") {
      stopScan();
    }
  }, [target, startPort, endPort, scanType, realPortScan, stopScan]);

  const handleStartScan = () => {
    if (!target.trim()) { toast.error("Please enter a target host"); return; }
    if (startPort > endPort) { toast.error("Start port must be less than end port"); return; }
    realPortScan(target, startPort, endPort, scanType);
  };

  // Real module handlers
  const handleDetectServices = async () => {
    if (!target.trim()) {
      toast.error("Please specify a target first");
      return;
    }
    
    toast.info("Detecting services on open ports...");
    try {
      const detected = await detectServices(target);
      setServices(detected);
      toast.success(`Detected ${detected.length} services`);
    } catch (error) {
      toast.error("Service detection failed");
    }
  };

  const handleFingerprintOS = async () => {
    if (!target.trim()) {
      toast.error("Please specify a target first");
      return;
    }
    
    toast.info("Fingerprinting operating systems...");
    try {
      const fingerprinted = await fingerprintOS(target);
      setHosts(fingerprinted);
      toast.success(`Fingerprinted ${fingerprinted.length} hosts`);
    } catch (error) {
      toast.error("OS fingerprinting failed");
    }
  };

  const handleRunScripts = async (scriptIds: string[]) => {
    if (!target.trim()) {
      toast.error("Please specify a target first");
      return;
    }
    
    toast.info(`Running ${scriptIds.length} security scripts...`);
    try {
      const results = await runScripts(scriptIds, target);
      setScriptResults(results as ScriptResult[]);
      toast.success(`Completed ${results.length} script checks`);
    } catch (error) {
      toast.error("Script execution failed");
    }
  };

  const handleAnalyzeFirewall = async () => {
    if (!target.trim()) {
      toast.error("Please specify a target first");
      return;
    }
    
    toast.info("Analyzing firewall behavior...");
    try {
      const analysis = await analyzeFirewall(target);
      setFirewallInfo(analysis);
      if (analysis?.detected) {
        toast.success(`Firewall detected: ${analysis.type}`);
      } else {
        toast.success("Firewall analysis complete");
      }
    } catch (error) {
      toast.error("Firewall analysis failed");
    }
  };

  const handleExport = async (format: "json" | "csv" | "pdf") => {
    if (!scanResult) {
      toast.error("No scan data available for export");
      return;
    }
    
    // This will be handled by the ReportsPanel component
    // Just show a toast for now
    toast.success(`${format.toUpperCase()} export initiated`);
  };

  // Build scan result for reports
  useEffect(() => {
    if (portResults.length > 0) {
      setScanResult({
        id: `scan-${Date.now()}`,
        target: target || "Unknown",
        scanType,
        startTime: new Date(Date.now() - elapsedTime * 1000),
        endTime: new Date(),
        duration: elapsedTime * 1000,
        hosts: hosts,
        ports: portResults,
        services: services,
        findings: services.filter(s => !s.secure).map(s => ({
          title: `Unencrypted ${s.name} service`,
          description: `Port ${s.port} is running ${s.name} without encryption`,
          severity: "low" as const,
          remediation: "Consider using TLS/SSL encryption",
        })),
      });
    }
  }, [portResults, hosts, services, target, scanType, elapsedTime]);

  const totalPorts = endPort - startPort + 1;

  if (!authorized) {
    return <AuthorizationModal isOpen={showAuthModal} onAccept={handleComplianceAccept} onDecline={() => toast.error("Authorization required to use this tool")} />;
  }

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <DashboardHeader activeTab={activeTab} onTabChange={setActiveTab} currentPhase={phase} onOpenCommandPalette={() => setShowCommandPalette(true)} />
      <CommandPalette isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} onAction={handleCommandAction} />

      <main className="container mx-auto px-4 py-8">
        <BrowserLimitations />
        
        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          <div className="space-y-6">
            {activeTab === "discovery" && (
              <HostDiscovery isScanning={isScanning && phase === "discovery"} hosts={discoveredHosts} onStartDiscovery={realHostDiscovery} onStopDiscovery={stopScan} />
            )}

            {activeTab === "ports" && (
              <>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-xl bg-card border border-border border-glow">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <TargetInput target={target} onChange={setTarget} isScanning={isScanning} />
                      <PortRangeSelector startPort={startPort} endPort={endPort} onStartPortChange={setStartPort} onEndPortChange={setEndPort} isScanning={isScanning} />
                    </div>
                    <ScanTypeSelector scanType={scanType} onChange={setScanType} isScanning={isScanning} />
                  </div>
                  <div className="mt-6 pt-6 border-t border-border flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground font-mono">
                      <span><span className="text-primary">{totalPorts.toLocaleString()}</span> ports</span>
                      <span>•</span>
                      <span className="capitalize">{scanType.replace("-", " ")}</span>
                    </div>
                    {isScanning ? (
                      <Button variant="destructive" size="lg" onClick={stopScan} className="min-w-[160px]"><Square className="h-4 w-4 mr-2" />Stop Scan</Button>
                    ) : (
                      <Button variant="scan" size="lg" onClick={handleStartScan} disabled={!target.trim()} className="min-w-[160px]"><Play className="h-4 w-4 mr-2" />Start Scan</Button>
                    )}
                  </div>
                </motion.div>
                <ScanProgress isScanning={isScanning} progress={progress} currentPort={currentPort} elapsedTime={elapsedTime} portsScanned={Math.floor((progress / 100) * totalPorts)} totalPorts={totalPorts} />
                <TerminalOutput logs={logs.map(l => ({ id: l.id, timestamp: l.timestamp, message: l.message, type: l.level === "success" ? "success" : l.level === "warning" ? "warning" : l.level === "error" ? "error" : "info" }))} />
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-xl bg-card border border-border">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Radar className="h-5 w-5 text-primary" />Scan Results</h2>
                  <ScanResults results={portResults.map(r => ({ port: r.port, status: r.status === "open" ? "open" : r.status === "filtered" ? "filtered" : "closed", service: r.service || "Unknown", latency: r.latency }))} isScanning={isScanning} />
                </motion.div>
              </>
            )}

            {activeTab === "services" && (
              <ServiceDetection 
                services={services} 
                isScanning={isScanning} 
                onDetectServices={handleDetectServices} 
              />
            )}

            {activeTab === "fingerprint" && (
              <OSFingerprint 
                hosts={hosts} 
                isScanning={isScanning} 
                onFingerprintOS={handleFingerprintOS} 
              />
            )}

            {activeTab === "scripts" && (
              <ScriptRunner 
                scriptResults={scriptResults} 
                isRunning={isScanning} 
                availableScripts={getAvailableScripts()}
                onRunScripts={handleRunScripts} 
              />
            )}

            {activeTab === "firewall" && (
              <FirewallDetection 
                firewallInfo={firewallInfo} 
                ports={portResults} 
                isAnalyzing={isScanning} 
                onAnalyzeFirewall={handleAnalyzeFirewall} 
              />
            )}

            {activeTab === "reports" && (
              <ReportsPanel 
                scanResult={scanResult} 
                hosts={hosts}
                services={services}
                findings={scanResult?.findings || []}
                onExport={handleExport} 
              />
            )}

            {activeTab === "settings" && (
              <Settings onSettingsChange={handleSettingsChange} />
            )}
          </div>

          <motion.aside initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="space-y-6">
            <div className="p-4 rounded-xl bg-card border border-border sticky top-24">
              <ScanHistory history={history.map(h => ({ id: h.id, target: h.target, timestamp: h.timestamp, openPorts: h.portsOpen, totalPorts: 1000, duration: h.duration }))} onSelect={(entry) => { setTarget(entry.target); setActiveTab("ports"); toast.info(`Loaded scan for ${entry.target}`); }} onClear={clearHistory} />
            </div>
            <div className="p-4 rounded-xl bg-card border border-border">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Hosts Up</span><span className="font-mono text-success">{discoveredHosts.length}</span></div>
                <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Open Ports</span><span className="font-mono text-success">{portResults.filter((r) => r.status === "open").length}</span></div>
                <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Filtered</span><span className="font-mono text-warning">{portResults.filter((r) => r.status === "filtered").length}</span></div>
              </div>
            </div>
          </motion.aside>
        </div>
      </main>
    </div>
  );
};

export default Index;
