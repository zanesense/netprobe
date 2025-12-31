// Core types for the Network Security Assessment Tool

export type ScanSeverity = "info" | "low" | "medium" | "high" | "critical";
export type PortStatus = "open" | "closed" | "filtered" | "open|filtered";
export type ScanPhase = "idle" | "discovery" | "scanning" | "detection" | "analysis" | "complete";

// Host Discovery Types
export type DiscoveryMethod = 
  | "icmp-echo" 
  | "icmp-timestamp" 
  | "icmp-netmask"
  | "tcp-syn" 
  | "tcp-ack" 
  | "udp" 
  | "arp"
  | "ipv6";

export interface DiscoveredHost {
  id: string;
  ip: string;
  hostname?: string;
  mac?: string;
  vendor?: string;
  method: DiscoveryMethod;
  latency: number;
  ttl: number;
  isAlive: boolean;
  discoveredAt: Date;
}

// Port Scanning Types
export type ScanType = 
  | "tcp-connect" 
  | "tcp-syn" 
  | "tcp-ack"
  | "udp" 
  | "service";

export interface PortResult {
  port: number;
  protocol: "tcp" | "udp";
  status: PortStatus;
  state: "open" | "closed" | "filtered";
  service?: string;
  version?: string;
  banner?: string;
  latency: number;
  reason?: string;
}

export interface ScanTarget {
  type: "single" | "range" | "cidr" | "domain" | "file";
  value: string;
  resolvedIPs?: string[];
}

// Service & Version Detection
export interface ServiceInfo {
  name: string;
  port: number;
  product?: string;
  version?: string;
  extraInfo?: string;
  osType?: string;
  deviceType?: string;
  cpe?: string[];
  banner?: string;
  secure?: boolean;
  confidence: number;
}

export interface BannerGrab {
  port: number;
  protocol: string;
  banner: string;
  timestamp: Date;
}

// OS Fingerprinting
export interface OSInfo {
  name: string;
  family?: string;
  generation?: string;
  accuracy: number;
  ttl: number;
  windowSize: number;
  deviceType: "server" | "router" | "switch" | "firewall" | "iot" | "workstation" | "storage" | "mobile" | "unknown";
  vendor?: string;
  cpe?: string;
}

export interface OSMatch {
  name: string;
  family: string;
  generation?: string;
  accuracy: number;
  deviceType: "server" | "router" | "switch" | "firewall" | "iot" | "workstation" | "unknown";
}

export interface TCPFingerprint {
  ttl: number;
  windowSize: number;
  dontFragment: boolean;
  synOptions: string[];
}

export interface Host {
  ip: string;
  hostname?: string;
  status: "up" | "down";
  ports: PortResult[];
  osInfo?: OSInfo;
}

export interface FirewallInfo {
  detected: boolean;
  type?: string;
  confidence: number;
  indicators: string[];
  avgResponseTime: number;
  responseVariance: number;
  rateLimitDetected: boolean;
  droppedPackets: number;
  resetResponses: number;
  icmpUnreachable: number;
}

export interface Finding {
  title: string;
  description: string;
  severity: "info" | "low" | "medium";
  remediation?: string;
}

export interface ScanResult {
  id: string;
  target: string;
  scanType: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  hosts: Host[];
  ports: PortResult[];
  services: ServiceInfo[];
  findings: Finding[];
}

// Script Checks (NSE-Inspired)
export type ScriptCategory = 
  | "auth" 
  | "discovery" 
  | "safe" 
  | "intrusive" 
  | "vuln" 
  | "default";

export interface ScriptResult {
  id: string;
  scriptId: string;
  name: string;
  category: ScriptCategory;
  port: number;
  host: string;
  output: string;
  severity: "info" | "low" | "medium";
  duration: number;
  timestamp: Date;
  findings?: ScriptFinding[];
}

export interface ScriptFinding {
  title: string;
  description: string;
  severity: ScanSeverity;
  remediation?: string;
}

// Firewall Detection
export interface FirewallIndicator {
  type: "stateful" | "packet-filter" | "proxy" | "ids/ips" | "unknown";
  evidence: string[];
  confidence: number;
  detectedAt: Date;
}

export interface FilterAnalysis {
  port: number;
  responseType: "no-response" | "rst" | "icmp-unreachable" | "timeout";
  inferredState: PortStatus;
  rateLimited: boolean;
  timing: {
    min: number;
    max: number;
    avg: number;
    stddev: number;
  };
}

// Scan Configuration
export type TimingTemplate = "paranoid" | "sneaky" | "polite" | "normal" | "aggressive" | "insane";

export interface ScanConfig {
  timing: TimingTemplate;
  maxParallelism: number;
  hostTimeout: number;
  scanDelay: number;
  maxRetries: number;
  ports: {
    start: number;
    end: number;
    preset?: "top100" | "top1000" | "all" | "custom";
  };
  discovery: {
    methods: DiscoveryMethod[];
    skipHostDiscovery: boolean;
  };
  detection: {
    serviceDetection: boolean;
    versionDetection: boolean;
    osDetection: boolean;
    scriptScan: boolean;
    selectedScripts: string[];
  };
}

// Scan Session
export interface ScanSession {
  id: string;
  name?: string;
  startTime: Date;
  endTime?: Date;
  status: "pending" | "running" | "paused" | "completed" | "aborted";
  target: ScanTarget;
  config: ScanConfig;
  phase: ScanPhase;
  progress: number;
  
  // Results
  discoveredHosts: DiscoveredHost[];
  portResults: Map<string, PortResult[]>; // hostIP -> results
  serviceInfo: Map<string, ServiceInfo[]>;
  osMatches: Map<string, OSMatch[]>;
  scriptResults: ScriptResult[];
  firewallIndicators: FirewallIndicator[];
  
  // Stats
  stats: ScanStats;
  logs: LogEntry[];
}

export interface ScanStats {
  hostsUp: number;
  hostsDown: number;
  hostsTotal: number;
  portsScanned: number;
  portsOpen: number;
  portsClosed: number;
  portsFiltered: number;
  servicesDetected: number;
  scriptsRun: number;
  findingsCount: Record<ScanSeverity, number>;
  elapsedTime: number;
  packetsPerSecond: number;
}

// Logging
export type LogLevel = "debug" | "info" | "success" | "warning" | "error";

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  category?: string;
  data?: Record<string, unknown>;
}

// Reporting
export interface ScanReport {
  id: string;
  session: ScanSession;
  generatedAt: Date;
  format: "json" | "csv" | "pdf" | "html";
  sections: ReportSection[];
}

export interface ReportSection {
  title: string;
  type: "summary" | "hosts" | "ports" | "services" | "os" | "scripts" | "vulnerabilities" | "recommendations";
  data: unknown;
}

// History
export interface ScanHistoryEntry {
  id: string;
  target: string;
  targetType: ScanTarget["type"];
  timestamp: Date;
  duration: number;
  hostsUp: number;
  portsOpen: number;
  findings: Record<ScanSeverity, number>;
  status: ScanSession["status"];
}

// Command Palette Actions
export interface CommandAction {
  id: string;
  label: string;
  shortcut?: string;
  icon?: string;
  category: "scan" | "view" | "export" | "settings" | "help";
  action: () => void;
}

// Authorization
export interface AuthorizationConsent {
  accepted: boolean;
  timestamp: Date;
  sessionId: string;
  targetConfirmed: boolean;
}
