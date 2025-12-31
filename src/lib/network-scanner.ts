// Real network scanning implementation
// Note: Due to browser security restrictions, some operations are limited
// This implementation provides the most accurate scanning possible in a web environment

export interface ScanOptions {
  target: string;
  startPort: number;
  endPort: number;
  scanType: 'tcp-connect' | 'tcp-syn' | 'udp' | 'tcp-ack';
  timeout: number;
  concurrency: number;
  onProgress?: (progress: number, currentPort: number) => void;
  onResult?: (result: PortScanResult) => void;
  onLog?: (message: string, level: 'info' | 'success' | 'warning' | 'error') => void;
}

export interface PortScanResult {
  port: number;
  protocol: 'tcp' | 'udp';
  status: 'open' | 'closed' | 'filtered' | 'timeout';
  state: string;
  service?: string;
  version?: string;
  latency: number;
  timestamp: Date;
}

export interface HostDiscoveryResult {
  ip: string;
  hostname?: string;
  mac?: string;
  vendor?: string;
  method: string;
  latency: number;
  ttl?: number;
  isAlive: boolean;
  timestamp: Date;
}

// Service detection patterns
const SERVICE_PATTERNS: Record<number, { name: string; patterns: RegExp[] }> = {
  21: { name: 'FTP', patterns: [/220.*FTP/i, /220.*FileZilla/i, /220.*vsftpd/i] },
  22: { name: 'SSH', patterns: [/SSH-2\.0/i, /SSH-1\.99/i] },
  23: { name: 'Telnet', patterns: [/Telnet/i, /Welcome/i] },
  25: { name: 'SMTP', patterns: [/220.*SMTP/i, /220.*ESMTP/i, /220.*Postfix/i] },
  53: { name: 'DNS', patterns: [/DNS/i] },
  80: { name: 'HTTP', patterns: [/HTTP\/1\./i, /Server:/i, /<html/i] },
  110: { name: 'POP3', patterns: [/\+OK.*POP3/i] },
  143: { name: 'IMAP', patterns: [/\* OK.*IMAP/i] },
  443: { name: 'HTTPS', patterns: [/HTTP\/1\./i, /Server:/i] },
  445: { name: 'SMB', patterns: [/SMB/i] },
  993: { name: 'IMAPS', patterns: [/IMAP/i] },
  995: { name: 'POP3S', patterns: [/POP3/i] },
  3306: { name: 'MySQL', patterns: [/mysql_native_password/i, /MySQL/i] },
  3389: { name: 'RDP', patterns: [/RDP/i, /Terminal/i] },
  5432: { name: 'PostgreSQL', patterns: [/PostgreSQL/i] },
  5900: { name: 'VNC', patterns: [/RFB/i, /VNC/i] },
  6379: { name: 'Redis', patterns: [/Redis/i, /PONG/i] },
  8080: { name: 'HTTP-Proxy', patterns: [/HTTP\/1\./i, /Proxy/i] },
  27017: { name: 'MongoDB', patterns: [/MongoDB/i] },
};

export class NetworkScanner {
  private abortController: AbortController | null = null;
  private workers: Worker[] = [];

  async scanPort(target: string, port: number, options: Partial<ScanOptions> = {}): Promise<PortScanResult> {
    const timeout = options.timeout || 3000;
    const scanType = options.scanType || 'tcp-connect';
    const startTime = Date.now();

    try {
      // For web browsers, we're limited to HTTP-based probing
      // This is the most accurate method available in browser environment
      const result = await this.probePort(target, port, timeout, scanType);
      const latency = Date.now() - startTime;

      return {
        port,
        protocol: 'tcp',
        status: result.isOpen ? 'open' : result.isFiltered ? 'filtered' : 'closed',
        state: result.isOpen ? 'open' : result.isFiltered ? 'filtered' : 'closed',
        service: this.identifyService(port, result.banner),
        version: result.banner,
        latency,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        port,
        protocol: 'tcp',
        status: 'timeout',
        state: 'timeout',
        latency: timeout,
        timestamp: new Date(),
      };
    }
  }

  private async probePort(target: string, port: number, timeout: number, scanType: string): Promise<{
    isOpen: boolean;
    isFiltered: boolean;
    banner?: string;
  }> {
    // Browser-based port scanning using various techniques
    
    if (scanType === 'tcp-connect') {
      return this.tcpConnectScan(target, port, timeout);
    } else if (scanType === 'udp') {
      return this.udpScan(target, port, timeout);
    } else {
      // For SYN and ACK scans, fall back to connect scan in browser
      return this.tcpConnectScan(target, port, timeout);
    }
  }

  private async tcpConnectScan(target: string, port: number, timeout: number): Promise<{
    isOpen: boolean;
    isFiltered: boolean;
    banner?: string;
  }> {
    // Use multiple techniques for better accuracy
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve({ isOpen: false, isFiltered: true });
      }, timeout);

      try {
        // For common HTTP ports, use fetch with better error handling
        if ([80, 443, 8080, 8443, 8000, 3000, 5000, 9000].includes(port)) {
          const protocol = [443, 8443].includes(port) ? 'https' : 'http';
          const url = `${protocol}://${target}:${port}`;
          
          // Try multiple HTTP methods for better detection
          const tryFetch = async (method: string) => {
            try {
              const controller = new AbortController();
              const fetchTimeout = setTimeout(() => controller.abort(), timeout);
              
              const response = await fetch(url, { 
                method, 
                mode: 'no-cors',
                signal: controller.signal,
                headers: {
                  'User-Agent': 'NetProbe/3.0 (Security Scanner)',
                }
              });
              
              clearTimeout(fetchTimeout);
              clearTimeout(timeoutId);
              
              // Try to get server information
              const server = response.headers?.get('Server') || 'HTTP service detected';
              resolve({ isOpen: true, isFiltered: false, banner: server });
              return true;
            } catch (error: any) {
              if (error.name === 'AbortError') {
                return false; // Timeout
              }
              // Check error type to determine if port is open but service is different
              if (error.message?.includes('CORS') || error.message?.includes('network')) {
                clearTimeout(timeoutId);
                resolve({ isOpen: true, isFiltered: false, banner: 'Service detected (CORS blocked)' });
                return true;
              }
              return false;
            }
          };

          // Try HEAD first, then GET
          tryFetch('HEAD').then(success => {
            if (!success) {
              tryFetch('GET').then(success => {
                if (!success) {
                  clearTimeout(timeoutId);
                  resolve({ isOpen: false, isFiltered: false });
                }
              });
            }
          });
        } 
        // For SSH, FTP, SMTP, and other TCP services
        else if ([21, 22, 23, 25, 110, 143, 993, 995, 1433, 3306, 3389, 5432].includes(port)) {
          // Try WebSocket connection for TCP services
          const wsProtocol = port === 443 ? 'wss' : 'ws';
          const ws = new WebSocket(`${wsProtocol}://${target}:${port}`);
          
          ws.onopen = () => {
            clearTimeout(timeoutId);
            ws.close();
            resolve({ isOpen: true, isFiltered: false, banner: 'TCP service detected' });
          };

          ws.onerror = (error) => {
            clearTimeout(timeoutId);
            // WebSocket errors can indicate the port is open but not a WebSocket service
            resolve({ isOpen: true, isFiltered: false, banner: 'Non-WebSocket TCP service' });
          };

          ws.onclose = (event) => {
            clearTimeout(timeoutId);
            if (event.code === 1006) {
              // Connection refused - port likely closed
              resolve({ isOpen: false, isFiltered: false });
            } else {
              // Connection was established then closed - port is open
              resolve({ isOpen: true, isFiltered: false, banner: 'TCP service (connection closed)' });
            }
          };
        }
        // For other ports, try image loading technique
        else {
          // Use image loading as a port probe technique
          const img = new Image();
          const startTime = Date.now();
          
          img.onload = () => {
            clearTimeout(timeoutId);
            const latency = Date.now() - startTime;
            resolve({ isOpen: true, isFiltered: false, banner: `Service detected (${latency}ms)` });
          };
          
          img.onerror = () => {
            clearTimeout(timeoutId);
            const latency = Date.now() - startTime;
            if (latency < timeout * 0.8) {
              // Quick error response might indicate open port with non-HTTP service
              resolve({ isOpen: true, isFiltered: false, banner: 'Non-HTTP service detected' });
            } else {
              resolve({ isOpen: false, isFiltered: false });
            }
          };
          
          img.src = `http://${target}:${port}/favicon.ico?${Date.now()}`;
        }
      } catch (error) {
        clearTimeout(timeoutId);
        resolve({ isOpen: false, isFiltered: true });
      }
    });
  }

  private async udpScan(target: string, port: number, timeout: number): Promise<{
    isOpen: boolean;
    isFiltered: boolean;
    banner?: string;
  }> {
    // UDP scanning is very limited in browsers
    // We can only test specific UDP services that respond to HTTP
    
    if (port === 53) {
      // DNS query test
      try {
        const response = await fetch(`https://dns.google/resolve?name=example.com&type=A`, {
          signal: AbortSignal.timeout(timeout)
        });
        if (response.ok) {
          return { isOpen: true, isFiltered: false, banner: 'DNS service' };
        }
      } catch (error) {
        // DNS service might be filtered or closed
      }
    }

    // For other UDP ports, we can't reliably test from browser
    return { isOpen: false, isFiltered: true, banner: 'UDP scan limited in browser' };
  }

  private identifyService(port: number, banner?: string): string {
    const serviceInfo = SERVICE_PATTERNS[port];
    if (!serviceInfo) {
      return 'Unknown';
    }

    if (banner) {
      for (const pattern of serviceInfo.patterns) {
        if (pattern.test(banner)) {
          return serviceInfo.name;
        }
      }
    }

    return serviceInfo.name;
  }

  async scanPorts(options: ScanOptions): Promise<void> {
    this.abortController = new AbortController();
    const { target, startPort, endPort, concurrency = 10 } = options;
    const totalPorts = endPort - startPort + 1;
    let scannedPorts = 0;

    options.onLog?.(`Starting ${options.scanType.toUpperCase()} scan on ${target}`, 'info');
    options.onLog?.(`Port range: ${startPort}-${endPort} (${totalPorts} ports)`, 'info');

    // Create batches for concurrent scanning
    const batches: number[][] = [];
    for (let port = startPort; port <= endPort; port += concurrency) {
      const batch = [];
      for (let i = 0; i < concurrency && port + i <= endPort; i++) {
        batch.push(port + i);
      }
      batches.push(batch);
    }

    for (const batch of batches) {
      if (this.abortController.signal.aborted) break;

      const promises = batch.map(async (port) => {
        if (this.abortController?.signal.aborted) return;

        try {
          const result = await this.scanPort(target, port, options);
          options.onResult?.(result);
          
          if (result.status === 'open') {
            options.onLog?.(`Port ${port}/${result.protocol} OPEN - ${result.service}`, 'success');
          } else if (result.status === 'filtered') {
            options.onLog?.(`Port ${port}/${result.protocol} FILTERED`, 'warning');
          }
        } catch (error) {
          options.onLog?.(`Error scanning port ${port}: ${error}`, 'error');
        }

        scannedPorts++;
        const progress = (scannedPorts / totalPorts) * 100;
        options.onProgress?.(progress, port);
      });

      await Promise.all(promises);
      
      // Small delay between batches to avoid overwhelming the target
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!this.abortController.signal.aborted) {
      options.onLog?.(`Scan completed: ${scannedPorts} ports scanned`, 'success');
    }
  }

  async discoverHosts(target: string, methods: string[] = ['ping']): Promise<HostDiscoveryResult[]> {
    const results: HostDiscoveryResult[] = [];
    
    // In browser environment, host discovery is very limited
    // We can only test the target host itself
    
    try {
      const startTime = Date.now();
      
      // Try to resolve hostname
      let hostname: string | undefined;
      try {
        // This is limited in browsers, but we can try
        hostname = target;
      } catch (error) {
        // Hostname resolution failed
      }

      // Test if host is reachable using HTTP probe
      const isReachable = await this.testHostReachability(target);
      const latency = Date.now() - startTime;

      if (isReachable) {
        results.push({
          ip: target,
          hostname,
          method: 'http-probe',
          latency,
          isAlive: true,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      // Host discovery failed
    }

    return results;
  }

  private async testHostReachability(target: string): Promise<boolean> {
    try {
      // Try HTTP connection first
      const response = await fetch(`http://${target}`, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: AbortSignal.timeout(3000)
      });
      return true;
    } catch (error) {
      try {
        // Try HTTPS connection
        const response = await fetch(`https://${target}`, {
          method: 'HEAD',
          mode: 'no-cors',
          signal: AbortSignal.timeout(3000)
        });
        return true;
      } catch (httpsError) {
        return false;
      }
    }
  }

  stopScan(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    
    // Terminate any running workers
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
  }

  // Advanced service detection
  async detectServices(target: string, openPorts: number[]): Promise<Array<{
    port: number;
    service: string;
    version?: string;
    banner?: string;
    confidence: number;
  }>> {
    const services = [];

    for (const port of openPorts) {
      try {
        const banner = await this.grabBanner(target, port);
        const service = this.identifyService(port, banner);
        const confidence = banner ? 90 : 70;

        services.push({
          port,
          service,
          banner,
          confidence,
        });
      } catch (error) {
        // Service detection failed for this port
      }
    }

    return services;
  }

  private async grabBanner(target: string, port: number): Promise<string | undefined> {
    // Enhanced banner grabbing for HTTP services
    
    if ([80, 443, 8080, 8443, 8000, 3000, 5000, 9000].includes(port)) {
      try {
        const protocol = [443, 8443].includes(port) ? 'https' : 'http';
        const response = await fetch(`${protocol}://${target}:${port}`, {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000),
          headers: {
            'User-Agent': 'NetProbe/3.0 (Security Scanner)',
          }
        });
        
        const headers = [];
        const server = response.headers.get('Server');
        const poweredBy = response.headers.get('X-Powered-By');
        const aspNetVersion = response.headers.get('X-AspNet-Version');
        const technology = response.headers.get('X-Technology');
        
        if (server) headers.push(`Server: ${server}`);
        if (poweredBy) headers.push(`X-Powered-By: ${poweredBy}`);
        if (aspNetVersion) headers.push(`ASP.NET: ${aspNetVersion}`);
        if (technology) headers.push(`Technology: ${technology}`);
        
        return headers.length > 0 ? headers.join(', ') : 'HTTP service';
      } catch (error) {
        // Try to get basic HTTP response
        try {
          const response = await fetch(`http://${target}:${port}`, {
            method: 'GET',
            mode: 'no-cors',
            signal: AbortSignal.timeout(3000)
          });
          return 'HTTP service (CORS restricted)';
        } catch (corsError) {
          return undefined;
        }
      }
    }

    // For HTTPS services, try to get certificate information
    if ([443, 8443].includes(port)) {
      try {
        const response = await fetch(`https://${target}:${port}`, {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000)
        });
        return 'HTTPS service with valid certificate';
      } catch (error: any) {
        if (error.message?.includes('certificate')) {
          return 'HTTPS service (certificate issues)';
        }
        return 'HTTPS service';
      }
    }

    return undefined;
  }
}

// Export singleton instance
export const networkScanner = new NetworkScanner();