// Hostname resolution utilities with multiple fallback methods

export interface DNSRecord {
  hostname: string;
  ipAddress: string;
  recordType: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'Browser Resolution' | 'Connectivity Test';
  ttl?: number;
  timestamp: Date;
  responseTime: number;
  priority?: number; // For MX records
}

export interface ResolverResult {
  hostname: string;
  records: DNSRecord[];
  error?: string;
  timestamp: Date;
  totalTime: number;
  methods: string[];
}

export class HostnameResolver {
  private static readonly DNS_SERVERS = [
    'https://dns.google/resolve',
    'https://cloudflare-dns.com/dns-query',
    'https://dns.quad9.net:5053/dns-query'
  ];

  private static readonly COMMON_PORTS = [80, 443, 8080, 8443, 3000, 5000, 8000, 9000];

  /**
   * Clean and validate hostname input
   */
  private static cleanHostname(input: string): string {
    return input
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .replace(/:\d+$/, ''); // Remove port if present
  }

  /**
   * Validate hostname format
   */
  private static isValidHostname(hostname: string): boolean {
    const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return hostnameRegex.test(hostname) && hostname.length <= 253;
  }

  /**
   * Resolve using Google DNS-over-HTTPS API
   */
  private static async resolveWithDNSAPI(hostname: string, recordType: string = 'A'): Promise<DNSRecord[]> {
    const records: DNSRecord[] = [];
    
    for (const dnsServer of this.DNS_SERVERS) {
      try {
        const startTime = Date.now();
        const url = `${dnsServer}?name=${encodeURIComponent(hostname)}&type=${recordType}`;
        
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/dns-json'
          },
          signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) continue;

        const data = await response.json();
        const responseTime = Date.now() - startTime;

        if (data.Answer) {
          for (const answer of data.Answer) {
            let type: DNSRecord['recordType'] = 'A';
            
            switch (answer.type) {
              case 1: type = 'A'; break;
              case 28: type = 'AAAA'; break;
              case 5: type = 'CNAME'; break;
              case 15: type = 'MX'; break;
              case 16: type = 'TXT'; break;
              default: continue;
            }

            records.push({
              hostname,
              ipAddress: answer.data,
              recordType: type,
              ttl: answer.TTL,
              timestamp: new Date(),
              responseTime,
              priority: answer.priority
            });
          }
        }

        // If we got results from this DNS server, break
        if (records.length > 0) break;
        
      } catch (error) {
        console.warn(`DNS API ${dnsServer} failed:`, error);
        continue;
      }
    }

    return records;
  }

  /**
   * Test connectivity to common ports
   */
  private static async testConnectivity(hostname: string): Promise<DNSRecord[]> {
    const records: DNSRecord[] = [];
    const testPromises: Promise<void>[] = [];

    for (const port of this.COMMON_PORTS) {
      const testPromise = (async () => {
        try {
          const startTime = Date.now();
          const protocols = port === 443 || port === 8443 ? ['https'] : ['http', 'https'];
          
          for (const protocol of protocols) {
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 5000);
              
              const response = await fetch(`${protocol}://${hostname}:${port}/favicon.ico`, {
                method: 'HEAD',
                mode: 'no-cors',
                signal: controller.signal
              });
              
              clearTimeout(timeoutId);
              
              records.push({
                hostname,
                ipAddress: `Reachable on ${protocol.toUpperCase()}:${port}`,
                recordType: 'Connectivity Test',
                timestamp: new Date(),
                responseTime: Date.now() - startTime
              });
              
              break; // Success, no need to try other protocols
            } catch (error) {
              // Try next protocol or port
              continue;
            }
          }
        } catch (error) {
          // Port not reachable
        }
      })();
      
      testPromises.push(testPromise);
    }

    // Wait for all connectivity tests with a reasonable timeout
    await Promise.allSettled(testPromises);
    return records;
  }

  /**
   * Browser-based resolution attempt
   */
  private static async browserResolve(hostname: string): Promise<DNSRecord[]> {
    const records: DNSRecord[] = [];
    
    try {
      const startTime = Date.now();
      
      // Method 1: Try to load a resource from the hostname
      const img = new Image();
      const resolvePromise = new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => resolve(false), 3000);
        
        img.onload = () => {
          clearTimeout(timeout);
          resolve(true);
        };
        
        img.onerror = () => {
          clearTimeout(timeout);
          resolve(false);
        };
      });

      img.src = `https://${hostname}/favicon.ico?${Date.now()}`;
      const resolved = await resolvePromise;
      
      if (resolved) {
        records.push({
          hostname,
          ipAddress: 'Hostname resolved (IP hidden by browser security)',
          recordType: 'Browser Resolution',
          timestamp: new Date(),
          responseTime: Date.now() - startTime
        });
      }
    } catch (error) {
      // Browser resolution failed
    }

    return records;
  }

  /**
   * Comprehensive hostname resolution using multiple methods
   */
  static async resolve(input: string): Promise<ResolverResult> {
    const startTime = Date.now();
    const hostname = this.cleanHostname(input);
    const methods: string[] = [];
    let allRecords: DNSRecord[] = [];
    let error: string | undefined;

    // Validate hostname
    if (!hostname) {
      return {
        hostname: input,
        records: [],
        error: 'Invalid hostname format',
        timestamp: new Date(),
        totalTime: Date.now() - startTime,
        methods: []
      };
    }

    if (!this.isValidHostname(hostname)) {
      return {
        hostname,
        records: [],
        error: 'Invalid hostname format',
        timestamp: new Date(),
        totalTime: Date.now() - startTime,
        methods: []
      };
    }

    try {
      // Method 1: DNS-over-HTTPS APIs
      try {
        methods.push('DNS-over-HTTPS');
        const dnsRecords = await this.resolveWithDNSAPI(hostname);
        allRecords.push(...dnsRecords);
        
        // Also try AAAA records for IPv6
        const ipv6Records = await this.resolveWithDNSAPI(hostname, 'AAAA');
        allRecords.push(...ipv6Records);
      } catch (err) {
        console.warn('DNS API resolution failed:', err);
      }

      // Method 2: Browser-based resolution
      if (allRecords.length === 0) {
        try {
          methods.push('Browser Resolution');
          const browserRecords = await this.browserResolve(hostname);
          allRecords.push(...browserRecords);
        } catch (err) {
          console.warn('Browser resolution failed:', err);
        }
      }

      // Method 3: Connectivity testing
      try {
        methods.push('Connectivity Test');
        const connectivityRecords = await this.testConnectivity(hostname);
        allRecords.push(...connectivityRecords);
      } catch (err) {
        console.warn('Connectivity test failed:', err);
      }

      // If no records found, set error
      if (allRecords.length === 0) {
        error = `Unable to resolve hostname: ${hostname}. The hostname may not exist or may not be reachable.`;
      }

    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown resolution error';
    }

    return {
      hostname,
      records: allRecords,
      error,
      timestamp: new Date(),
      totalTime: Date.now() - startTime,
      methods
    };
  }

  /**
   * Batch resolve multiple hostnames
   */
  static async resolveBatch(hostnames: string[]): Promise<ResolverResult[]> {
    const promises = hostnames.map(hostname => this.resolve(hostname));
    return Promise.all(promises);
  }

  /**
   * Get reverse DNS lookup (IP to hostname) - limited in browser
   */
  static async reverseLookup(ip: string): Promise<ResolverResult> {
    const startTime = Date.now();
    
    // Basic IP validation
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip)) {
      return {
        hostname: ip,
        records: [],
        error: 'Invalid IP address format',
        timestamp: new Date(),
        totalTime: Date.now() - startTime,
        methods: []
      };
    }

    // Reverse DNS is very limited in browsers
    return {
      hostname: ip,
      records: [],
      error: 'Reverse DNS lookup is not supported in browser environment due to security restrictions',
      timestamp: new Date(),
      totalTime: Date.now() - startTime,
      methods: ['Browser Limitation']
    };
  }
}