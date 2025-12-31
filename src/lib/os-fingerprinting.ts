// Real OS fingerprinting implementation for browser environment
// Limited by browser security but provides what's possible

export interface OSFingerprint {
  name: string;
  family: string;
  generation?: string;
  accuracy: number;
  deviceType: 'workstation' | 'server' | 'router' | 'switch' | 'firewall' | 'unknown';
  confidence: number;
  methods: string[];
}

export interface TCPFingerprint {
  windowSize: number;
  ttl: number;
  mss?: number;
  windowScale?: number;
  timestamps?: boolean;
  selectiveAck?: boolean;
}

export class OSFingerprintEngine {
  // TTL-based OS detection patterns
  private static TTL_PATTERNS: Record<number, OSFingerprint[]> = {
    64: [
      { name: 'Linux 5.x/6.x', family: 'Linux', generation: '5.x+', accuracy: 85, deviceType: 'server', confidence: 80, methods: ['TTL'] },
      { name: 'Linux 4.x', family: 'Linux', generation: '4.x', accuracy: 80, deviceType: 'server', confidence: 75, methods: ['TTL'] },
      { name: 'Android', family: 'Linux', generation: 'Mobile', accuracy: 70, deviceType: 'workstation', confidence: 65, methods: ['TTL'] },
    ],
    128: [
      { name: 'Windows 10/11', family: 'Windows', generation: '10+', accuracy: 90, deviceType: 'workstation', confidence: 85, methods: ['TTL'] },
      { name: 'Windows Server 2019/2022', family: 'Windows', generation: 'Server', accuracy: 85, deviceType: 'server', confidence: 80, methods: ['TTL'] },
      { name: 'Windows 8/8.1', family: 'Windows', generation: '8.x', accuracy: 75, deviceType: 'workstation', confidence: 70, methods: ['TTL'] },
    ],
    255: [
      { name: 'Cisco IOS', family: 'Cisco', accuracy: 90, deviceType: 'router', confidence: 85, methods: ['TTL'] },
      { name: 'FreeBSD 13.x/14.x', family: 'BSD', generation: '13.x+', accuracy: 80, deviceType: 'server', confidence: 75, methods: ['TTL'] },
      { name: 'Solaris/OpenSolaris', family: 'Solaris', accuracy: 70, deviceType: 'server', confidence: 65, methods: ['TTL'] },
    ],
    32: [
      { name: 'Windows 95/98/ME', family: 'Windows', generation: '9x', accuracy: 95, deviceType: 'workstation', confidence: 90, methods: ['TTL'] },
    ],
    60: [
      { name: 'macOS/Mac OS X', family: 'Darwin', accuracy: 85, deviceType: 'workstation', confidence: 80, methods: ['TTL'] },
      { name: 'iOS/iPadOS', family: 'Darwin', generation: 'Mobile', accuracy: 75, deviceType: 'workstation', confidence: 70, methods: ['TTL'] },
    ],
  };

  // HTTP header-based OS detection
  private static HTTP_PATTERNS: Array<{
    pattern: RegExp;
    os: OSFingerprint;
  }> = [
    {
      pattern: /IIS\/10\.0/i,
      os: { name: 'Windows Server 2016/2019/2022', family: 'Windows', generation: 'Server', accuracy: 90, deviceType: 'server', confidence: 85, methods: ['HTTP'] }
    },
    {
      pattern: /Apache\/2\.[45]/i,
      os: { name: 'Linux (Apache)', family: 'Linux', accuracy: 75, deviceType: 'server', confidence: 70, methods: ['HTTP'] }
    },
    {
      pattern: /nginx\/1\./i,
      os: { name: 'Linux (nginx)', family: 'Linux', accuracy: 75, deviceType: 'server', confidence: 70, methods: ['HTTP'] }
    },
    {
      pattern: /Microsoft-HTTPAPI/i,
      os: { name: 'Windows Server', family: 'Windows', generation: 'Server', accuracy: 85, deviceType: 'server', confidence: 80, methods: ['HTTP'] }
    },
    {
      pattern: /cloudflare/i,
      os: { name: 'CloudFlare CDN', family: 'Linux', accuracy: 60, deviceType: 'server', confidence: 55, methods: ['HTTP'] }
    },
  ];

  // Service-based OS hints
  private static SERVICE_PATTERNS: Record<string, OSFingerprint[]> = {
    'SSH': [
      { name: 'Linux/Unix SSH', family: 'Linux', accuracy: 70, deviceType: 'server', confidence: 65, methods: ['Service'] },
    ],
    'RDP': [
      { name: 'Windows RDP', family: 'Windows', accuracy: 95, deviceType: 'server', confidence: 90, methods: ['Service'] },
    ],
    'SMB': [
      { name: 'Windows SMB', family: 'Windows', accuracy: 90, deviceType: 'server', confidence: 85, methods: ['Service'] },
    ],
    'SNMP': [
      { name: 'Network Device', family: 'Embedded', accuracy: 80, deviceType: 'router', confidence: 75, methods: ['Service'] },
    ],
  };

  static async fingerprintOS(
    target: string, 
    openPorts: Array<{ port: number; service?: string; banner?: string }>,
    discoveredHosts?: Array<{ ttl?: number; latency: number }>
  ): Promise<OSFingerprint[]> {
    const fingerprints: OSFingerprint[] = [];
    const methods: Set<string> = new Set();

    // TTL-based fingerprinting
    if (discoveredHosts && discoveredHosts.length > 0) {
      const host = discoveredHosts[0];
      if (host.ttl) {
        const ttlMatches = this.TTL_PATTERNS[host.ttl] || [];
        fingerprints.push(...ttlMatches.map(fp => ({ ...fp, methods: [...fp.methods, 'TTL'] })));
        methods.add('TTL');
      }
    }

    // HTTP header-based fingerprinting
    for (const port of openPorts) {
      if ([80, 443, 8080, 8443].includes(port.port) && port.banner) {
        for (const pattern of this.HTTP_PATTERNS) {
          if (pattern.pattern.test(port.banner)) {
            fingerprints.push({
              ...pattern.os,
              methods: [...pattern.os.methods, 'HTTP-Headers']
            });
            methods.add('HTTP-Headers');
          }
        }
      }
    }

    // Service-based fingerprinting
    for (const port of openPorts) {
      if (port.service) {
        const serviceMatches = this.SERVICE_PATTERNS[port.service.toUpperCase()] || [];
        fingerprints.push(...serviceMatches.map(fp => ({ 
          ...fp, 
          methods: [...fp.methods, 'Service-Detection'] 
        })));
        methods.add('Service-Detection');
      }
    }

    // Advanced HTTP fingerprinting
    const httpFingerprints = await this.performHTTPFingerprinting(target, openPorts);
    fingerprints.push(...httpFingerprints);

    // Deduplicate and rank fingerprints
    const uniqueFingerprints = this.deduplicateFingerprints(fingerprints);
    
    // Sort by confidence score
    return uniqueFingerprints.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  }

  private static async performHTTPFingerprinting(
    target: string,
    openPorts: Array<{ port: number; service?: string }>
  ): Promise<OSFingerprint[]> {
    const fingerprints: OSFingerprint[] = [];
    
    const httpPorts = openPorts.filter(p => [80, 443, 8080, 8443].includes(p.port));
    
    for (const portInfo of httpPorts) {
      try {
        const protocol = [443, 8443].includes(portInfo.port) ? 'https' : 'http';
        const response = await fetch(`${protocol}://${target}:${portInfo.port}`, {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000),
          headers: {
            'User-Agent': 'NetProbe/3.0 OS-Fingerprint',
          }
        });

        // Analyze response headers for OS clues
        const server = response.headers.get('Server') || '';
        const poweredBy = response.headers.get('X-Powered-By') || '';
        const aspNet = response.headers.get('X-AspNet-Version') || '';
        
        // Windows IIS detection
        if (server.includes('IIS')) {
          const version = server.match(/IIS\/(\d+\.\d+)/)?.[1];
          let windowsVersion = 'Windows Server';
          let confidence = 85;
          
          if (version === '10.0') {
            windowsVersion = 'Windows Server 2016/2019/2022';
            confidence = 90;
          } else if (version === '8.5') {
            windowsVersion = 'Windows Server 2012 R2';
            confidence = 95;
          }
          
          fingerprints.push({
            name: windowsVersion,
            family: 'Windows',
            generation: 'Server',
            accuracy: confidence,
            deviceType: 'server',
            confidence,
            methods: ['HTTP-Server-Header']
          });
        }

        // Apache detection (usually Linux)
        if (server.includes('Apache')) {
          const osHint = server.match(/\(([^)]+)\)/)?.[1] || '';
          let osName = 'Linux (Apache)';
          let confidence = 75;
          
          if (osHint.includes('Ubuntu')) {
            osName = 'Ubuntu Linux';
            confidence = 85;
          } else if (osHint.includes('CentOS')) {
            osName = 'CentOS Linux';
            confidence = 85;
          } else if (osHint.includes('Red Hat')) {
            osName = 'Red Hat Enterprise Linux';
            confidence = 85;
          }
          
          fingerprints.push({
            name: osName,
            family: 'Linux',
            accuracy: confidence,
            deviceType: 'server',
            confidence,
            methods: ['HTTP-Server-Header']
          });
        }

        // nginx detection (usually Linux)
        if (server.includes('nginx')) {
          fingerprints.push({
            name: 'Linux (nginx)',
            family: 'Linux',
            accuracy: 75,
            deviceType: 'server',
            confidence: 70,
            methods: ['HTTP-Server-Header']
          });
        }

        // ASP.NET detection (Windows)
        if (aspNet || poweredBy.includes('ASP.NET')) {
          fingerprints.push({
            name: 'Windows Server (ASP.NET)',
            family: 'Windows',
            generation: 'Server',
            accuracy: 90,
            deviceType: 'server',
            confidence: 85,
            methods: ['HTTP-ASP.NET-Header']
          });
        }

      } catch (error) {
        // HTTP fingerprinting failed for this port
        continue;
      }
    }

    return fingerprints;
  }

  private static deduplicateFingerprints(fingerprints: OSFingerprint[]): OSFingerprint[] {
    const seen = new Map<string, OSFingerprint>();
    
    for (const fp of fingerprints) {
      const key = `${fp.name}-${fp.family}`;
      const existing = seen.get(key);
      
      if (!existing || fp.confidence > existing.confidence) {
        // Merge methods from duplicate entries
        const methods = existing ? 
          [...new Set([...existing.methods, ...fp.methods])] : 
          fp.methods;
        
        seen.set(key, {
          ...fp,
          methods,
          confidence: Math.max(fp.confidence, existing?.confidence || 0)
        });
      }
    }
    
    return Array.from(seen.values());
  }

  // Browser-based client OS detection (for reference)
  static detectClientOS(): OSFingerprint {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    
    if (userAgent.includes('Windows NT')) {
      const version = userAgent.match(/Windows NT (\d+\.\d+)/)?.[1];
      let windowsName = 'Windows';
      
      switch (version) {
        case '10.0':
          windowsName = userAgent.includes('Windows NT 10.0') ? 'Windows 10/11' : 'Windows 10';
          break;
        case '6.3':
          windowsName = 'Windows 8.1';
          break;
        case '6.2':
          windowsName = 'Windows 8';
          break;
        case '6.1':
          windowsName = 'Windows 7';
          break;
      }
      
      return {
        name: windowsName,
        family: 'Windows',
        generation: version || 'Unknown',
        accuracy: 95,
        deviceType: 'workstation',
        confidence: 90,
        methods: ['User-Agent']
      };
    }
    
    if (userAgent.includes('Mac OS X') || userAgent.includes('macOS')) {
      return {
        name: 'macOS',
        family: 'Darwin',
        accuracy: 95,
        deviceType: 'workstation',
        confidence: 90,
        methods: ['User-Agent']
      };
    }
    
    if (userAgent.includes('Linux')) {
      return {
        name: 'Linux',
        family: 'Linux',
        accuracy: 90,
        deviceType: 'workstation',
        confidence: 85,
        methods: ['User-Agent']
      };
    }
    
    return {
      name: 'Unknown',
      family: 'Unknown',
      accuracy: 0,
      deviceType: 'unknown',
      confidence: 0,
      methods: ['User-Agent']
    };
  }
}