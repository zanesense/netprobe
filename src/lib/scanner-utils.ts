import { 
  DiscoveredHost, 
  PortResult, 
  ServiceInfo, 
  OSMatch, 
  ScriptResult,
  ScanSeverity,
  TimingTemplate,
  DiscoveryMethod
} from "@/types/scanner";

// Common port/service mappings
export const COMMON_SERVICES: Record<number, { name: string; protocol: string }> = {
  20: { name: "FTP-Data", protocol: "tcp" },
  21: { name: "FTP", protocol: "tcp" },
  22: { name: "SSH", protocol: "tcp" },
  23: { name: "Telnet", protocol: "tcp" },
  25: { name: "SMTP", protocol: "tcp" },
  53: { name: "DNS", protocol: "udp" },
  67: { name: "DHCP", protocol: "udp" },
  68: { name: "DHCP", protocol: "udp" },
  69: { name: "TFTP", protocol: "udp" },
  80: { name: "HTTP", protocol: "tcp" },
  110: { name: "POP3", protocol: "tcp" },
  119: { name: "NNTP", protocol: "tcp" },
  123: { name: "NTP", protocol: "udp" },
  135: { name: "MSRPC", protocol: "tcp" },
  137: { name: "NetBIOS-NS", protocol: "udp" },
  138: { name: "NetBIOS-DGM", protocol: "udp" },
  139: { name: "NetBIOS-SSN", protocol: "tcp" },
  143: { name: "IMAP", protocol: "tcp" },
  161: { name: "SNMP", protocol: "udp" },
  162: { name: "SNMP-Trap", protocol: "udp" },
  389: { name: "LDAP", protocol: "tcp" },
  443: { name: "HTTPS", protocol: "tcp" },
  445: { name: "SMB", protocol: "tcp" },
  465: { name: "SMTPS", protocol: "tcp" },
  514: { name: "Syslog", protocol: "udp" },
  587: { name: "Submission", protocol: "tcp" },
  636: { name: "LDAPS", protocol: "tcp" },
  993: { name: "IMAPS", protocol: "tcp" },
  995: { name: "POP3S", protocol: "tcp" },
  1433: { name: "MSSQL", protocol: "tcp" },
  1521: { name: "Oracle", protocol: "tcp" },
  1883: { name: "MQTT", protocol: "tcp" },
  2049: { name: "NFS", protocol: "tcp" },
  3306: { name: "MySQL", protocol: "tcp" },
  3389: { name: "RDP", protocol: "tcp" },
  5432: { name: "PostgreSQL", protocol: "tcp" },
  5672: { name: "AMQP", protocol: "tcp" },
  5900: { name: "VNC", protocol: "tcp" },
  6379: { name: "Redis", protocol: "tcp" },
  8080: { name: "HTTP-Proxy", protocol: "tcp" },
  8443: { name: "HTTPS-Alt", protocol: "tcp" },
  9000: { name: "SonarQube", protocol: "tcp" },
  9200: { name: "Elasticsearch", protocol: "tcp" },
  27017: { name: "MongoDB", protocol: "tcp" },
};

// Version banners for simulation
export const SERVICE_BANNERS: Record<string, string[]> = {
  SSH: [
    "SSH-2.0-OpenSSH_8.9p1 Ubuntu-3ubuntu0.1",
    "SSH-2.0-OpenSSH_9.0",
    "SSH-2.0-dropbear_2022.83",
  ],
  HTTP: [
    "Apache/2.4.54 (Ubuntu)",
    "nginx/1.24.0",
    "Microsoft-IIS/10.0",
  ],
  HTTPS: [
    "Apache/2.4.54 (Ubuntu) OpenSSL/3.0.5",
    "nginx/1.24.0",
    "cloudflare",
  ],
  FTP: [
    "vsftpd 3.0.5",
    "ProFTPD 1.3.8",
    "Pure-FTPd",
  ],
  SMTP: [
    "Postfix",
    "Exim 4.96",
    "Microsoft ESMTP MAIL Service",
  ],
  MySQL: [
    "8.0.32-0ubuntu0.22.04.2",
    "5.7.41",
    "MariaDB 10.11.2",
  ],
  PostgreSQL: [
    "PostgreSQL 15.2",
    "PostgreSQL 14.7",
  ],
  Redis: [
    "6.2.11",
    "7.0.9",
  ],
};

// OS fingerprint patterns
export const OS_FINGERPRINTS: Record<number, OSMatch[]> = {
  64: [
    { name: "Linux 5.x", family: "Linux", generation: "5.x", accuracy: 95, deviceType: "server" },
    { name: "Linux 4.x", family: "Linux", generation: "4.x", accuracy: 90, deviceType: "server" },
  ],
  128: [
    { name: "Windows 10/11", family: "Windows", generation: "10+", accuracy: 95, deviceType: "workstation" },
    { name: "Windows Server 2019/2022", family: "Windows", accuracy: 90, deviceType: "server" },
  ],
  255: [
    { name: "Cisco IOS", family: "Cisco", accuracy: 90, deviceType: "router" },
    { name: "FreeBSD 13.x", family: "BSD", accuracy: 85, deviceType: "server" },
  ],
};

// MAC vendor prefixes
export const MAC_VENDORS: Record<string, string> = {
  "00:50:56": "VMware",
  "00:0C:29": "VMware",
  "08:00:27": "VirtualBox",
  "52:54:00": "QEMU",
  "00:1A:A0": "Dell",
  "00:25:64": "Dell",
  "3C:D9:2B": "HP",
  "00:1E:0B": "HP",
  "00:1B:21": "Intel",
  "00:1F:C6": "ASUSTek",
  "D4:3D:7E": "Micro-Star",
  "B8:27:EB": "Raspberry Pi",
  "DC:A6:32": "Raspberry Pi",
};

// Timing presets
export const TIMING_PRESETS: Record<TimingTemplate, { delay: number; parallel: number; timeout: number; retries: number }> = {
  paranoid: { delay: 5000, parallel: 1, timeout: 60000, retries: 10 },
  sneaky: { delay: 1000, parallel: 1, timeout: 30000, retries: 5 },
  polite: { delay: 400, parallel: 2, timeout: 10000, retries: 3 },
  normal: { delay: 100, parallel: 10, timeout: 5000, retries: 2 },
  aggressive: { delay: 10, parallel: 50, timeout: 1250, retries: 1 },
  insane: { delay: 0, parallel: 100, timeout: 300, retries: 0 },
};

// Discovery method descriptions
export const DISCOVERY_METHODS: Record<DiscoveryMethod, { name: string; description: string }> = {
  "icmp-echo": { name: "ICMP Echo", description: "Standard ping request" },
  "icmp-timestamp": { name: "ICMP Timestamp", description: "Timestamp request for firewall bypass" },
  "icmp-netmask": { name: "ICMP Netmask", description: "Address mask request" },
  "tcp-syn": { name: "TCP SYN Ping", description: "Half-open TCP connection probe" },
  "tcp-ack": { name: "TCP ACK Ping", description: "ACK probe to detect stateful firewalls" },
  "udp": { name: "UDP Ping", description: "UDP probe to common ports" },
  "arp": { name: "ARP Discovery", description: "Local network only, most reliable" },
  "ipv6": { name: "IPv6 Discovery", description: "IPv6 neighbor discovery" },
};

// Severity colors and icons
export const SEVERITY_CONFIG: Record<ScanSeverity, { color: string; bg: string; border: string }> = {
  info: { color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/30" },
  low: { color: "text-success", bg: "bg-success/10", border: "border-success/30" },
  medium: { color: "text-warning", bg: "bg-warning/10", border: "border-warning/30" },
  high: { color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30" },
  critical: { color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30" },
};

// Utility functions
export function generateId(): string {
  return crypto.randomUUID();
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function isValidIP(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  if (ipv4Regex.test(ip)) {
    const parts = ip.split(".").map(Number);
    return parts.every((p) => p >= 0 && p <= 255);
  }
  
  return ipv6Regex.test(ip);
}

export function isValidCIDR(cidr: string): boolean {
  const [ip, prefix] = cidr.split("/");
  if (!prefix) return false;
  const prefixNum = parseInt(prefix);
  return isValidIP(ip) && prefixNum >= 0 && prefixNum <= 32;
}

export function isValidDomain(domain: string): boolean {
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
  return domainRegex.test(domain);
}

export function parseTarget(input: string): { type: "single" | "range" | "cidr" | "domain"; value: string } | null {
  input = input.trim();
  
  if (isValidIP(input)) {
    return { type: "single", value: input };
  }
  
  if (input.includes("-") && input.split("-").every(isValidIP)) {
    return { type: "range", value: input };
  }
  
  if (isValidCIDR(input)) {
    return { type: "cidr", value: input };
  }
  
  if (isValidDomain(input)) {
    return { type: "domain", value: input };
  }
  
  return null;
}

export function generateRandomMAC(): string {
  const prefixes = Object.keys(MAC_VENDORS);
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = Array.from({ length: 3 }, () =>
    Math.floor(Math.random() * 256).toString(16).padStart(2, "0").toUpperCase()
  ).join(":");
  return `${prefix}:${suffix}`;
}

export function getVendorFromMAC(mac: string): string {
  const prefix = mac.substring(0, 8).toUpperCase();
  return MAC_VENDORS[prefix] || "Unknown";
}

export function generateRandomIP(baseIP: string = "192.168.1.0"): string {
  const parts = baseIP.split(".").map(Number);
  parts[3] = Math.floor(Math.random() * 254) + 1;
  return parts.join(".");
}

export function expandCIDR(cidr: string): string[] {
  const [ip, prefix] = cidr.split("/");
  const prefixNum = parseInt(prefix);
  const hostBits = 32 - prefixNum;
  const numHosts = Math.min(Math.pow(2, hostBits) - 2, 256); // Limit for simulation
  
  const parts = ip.split(".").map(Number);
  const baseIP = (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
  
  const ips: string[] = [];
  for (let i = 1; i <= numHosts; i++) {
    const newIP = baseIP + i;
    ips.push([
      (newIP >> 24) & 255,
      (newIP >> 16) & 255,
      (newIP >> 8) & 255,
      newIP & 255,
    ].join("."));
  }
  
  return ips;
}

// Port presets
export const PORT_PRESETS = {
  top100: [
    7, 9, 13, 21, 22, 23, 25, 26, 37, 53, 79, 80, 81, 88, 106, 110, 111, 113, 119, 135,
    139, 143, 144, 179, 199, 389, 427, 443, 444, 445, 465, 513, 514, 515, 543, 544, 548,
    554, 587, 631, 646, 873, 990, 993, 995, 1025, 1026, 1027, 1028, 1029, 1110, 1433, 1720,
    1723, 1755, 1900, 2000, 2001, 2049, 2121, 2717, 3000, 3128, 3306, 3389, 3986, 4899, 5000,
    5009, 5051, 5060, 5101, 5190, 5357, 5432, 5631, 5666, 5800, 5900, 6000, 6001, 6646, 7070,
    8000, 8008, 8009, 8080, 8081, 8443, 8888, 9100, 9999, 10000, 32768, 49152, 49153, 49154,
    49155, 49156, 49157,
  ],
  top1000: Array.from({ length: 1000 }, (_, i) => i + 1),
  all: Array.from({ length: 65535 }, (_, i) => i + 1),
};
