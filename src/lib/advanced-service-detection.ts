// Advanced service detection with real banner grabbing and fingerprinting

export interface ServiceSignature {
  name: string;
  patterns: RegExp[];
  ports: number[];
  confidence: number;
  category: 'web' | 'database' | 'mail' | 'file' | 'remote' | 'network' | 'security' | 'other';
  secure: boolean;
  commonVersions: string[];
}

export interface DetectedService {
  port: number;
  protocol: 'tcp' | 'udp';
  name: string;
  product?: string;
  version?: string;
  extraInfo?: string;
  osType?: string;
  deviceType?: string;
  banner?: string;
  confidence: number;
  category: string;
  secure: boolean;
  cpe?: string[];
  vulnerabilities?: ServiceVulnerability[];
  methods: string[];
}

export interface ServiceVulnerability {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  cvss?: number;
  cve?: string;
}

// Comprehensive service signatures database
export const SERVICE_SIGNATURES: ServiceSignature[] = [
  // Web Services
  {
    name: 'Apache HTTP Server',
    patterns: [/Apache\/(\d+\.\d+\.\d+)/i, /Apache/i],
    ports: [80, 443, 8080, 8443],
    confidence: 90,
    category: 'web',
    secure: false,
    commonVersions: ['2.4.54', '2.4.52', '2.4.41']
  },
  {
    name: 'nginx',
    patterns: [/nginx\/(\d+\.\d+\.\d+)/i, /nginx/i],
    ports: [80, 443, 8080, 8443],
    confidence: 95,
    category: 'web',
    secure: false,
    commonVersions: ['1.24.0', '1.22.1', '1.20.2']
  },
  {
    name: 'Microsoft IIS',
    patterns: [/Microsoft-IIS\/(\d+\.\d+)/i, /IIS/i],
    ports: [80, 443, 8080],
    confidence: 95,
    category: 'web',
    secure: false,
    commonVersions: ['10.0', '8.5', '7.5']
  },
  {
    name: 'Cloudflare',
    patterns: [/cloudflare/i, /cf-ray/i],
    ports: [80, 443],
    confidence: 85,
    category: 'web',
    secure: true,
    commonVersions: ['CDN']
  },
  
  // SSH Services
  {
    name: 'OpenSSH',
    patterns: [/SSH-2\.0-OpenSSH_(\d+\.\d+)/i, /OpenSSH/i],
    ports: [22, 2222],
    confidence: 95,
    category: 'remote',
    secure: true,
    commonVersions: ['8.9p1', '8.4p1', '7.4']
  },
  {
    name: 'Dropbear SSH',
    patterns: [/SSH-2\.0-dropbear_(\d+\.\d+)/i, /dropbear/i],
    ports: [22],
    confidence: 90,
    category: 'remote',
    secure: true,
    commonVersions: ['2022.83', '2020.81']
  },
  
  // Database Services
  {
    name: 'MySQL',
    patterns: [/mysql_native_password/i, /MySQL/i, /MariaDB/i],
    ports: [3306],
    confidence: 90,
    category: 'database',
    secure: false,
    commonVersions: ['8.0.32', '5.7.41', '10.11.2']
  },
  {
    name: 'PostgreSQL',
    patterns: [/PostgreSQL/i, /postgres/i],
    ports: [5432],
    confidence: 90,
    category: 'database',
    secure: false,
    commonVersions: ['15.2', '14.7', '13.10']
  },
  {
    name: 'MongoDB',
    patterns: [/MongoDB/i, /mongo/i],
    ports: [27017, 27018, 27019],
    confidence: 85,
    category: 'database',
    secure: false,
    commonVersions: ['6.0.4', '5.0.15', '4.4.18']
  },
  {
    name: 'Redis',
    patterns: [/Redis/i, /PONG/i, /redis_version/i],
    ports: [6379],
    confidence: 90,
    category: 'database',
    secure: false,
    commonVersions: ['7.0.9', '6.2.11', '5.0.14']
  },
  
  // Mail Services
  {
    name: 'Postfix SMTP',
    patterns: [/Postfix/i, /ESMTP Postfix/i],
    ports: [25, 587],
    confidence: 90,
    category: 'mail',
    secure: false,
    commonVersions: ['3.6.4', '3.5.18']
  },
  {
    name: 'Microsoft Exchange',
    patterns: [/Microsoft ESMTP MAIL/i, /Exchange/i],
    ports: [25, 587, 993, 995],
    confidence: 85,
    category: 'mail',
    secure: false,
    commonVersions: ['2019', '2016', '2013']
  },
  
  // File Services
  {
    name: 'vsftpd',
    patterns: [/vsftpd (\d+\.\d+\.\d+)/i, /vsftpd/i],
    ports: [21],
    confidence: 90,
    category: 'file',
    secure: false,
    commonVersions: ['3.0.5', '3.0.3']
  },
  {
    name: 'ProFTPD',
    patterns: [/ProFTPD (\d+\.\d+\.\d+)/i, /ProFTPD/i],
    ports: [21],
    confidence: 90,
    category: 'file',
    secure: false,
    commonVersions: ['1.3.8', '1.3.7']
  },
  {
    name: 'Samba SMB',
    patterns: [/Samba/i, /SMB/i],
    ports: [139, 445],
    confidence: 85,
    category: 'file',
    secure: false,
    commonVersions: ['4.17.5', '4.15.13']
  },
  
  // Remote Access
  {
    name: 'Microsoft RDP',
    patterns: [/RDP/i, /Terminal Services/i, /Remote Desktop/i],
    ports: [3389],
    confidence: 90,
    category: 'remote',
    secure: false,
    commonVersions: ['10.0', '6.3', '6.1']
  },
  {
    name: 'VNC Server',
    patterns: [/RFB/i, /VNC/i, /TightVNC/i, /RealVNC/i],
    ports: [5900, 5901, 5902],
    confidence: 85,
    category: 'remote',
    secure: false,
    commonVersions: ['4.1.3', '1.12.0']
  },
  
  // Network Services
  {
    name: 'BIND DNS',
    patterns: [/BIND/i, /named/i],
    ports: [53],
    confidence: 80,
    category: 'network',
    secure: false,
    commonVersions: ['9.18.12', '9.16.37']
  },
  {
    name: 'ISC DHCP',
    patterns: [/ISC DHCP/i, /dhcpd/i],
    ports: [67, 68],
    confidence: 75,
    category: 'network',
    secure: false,
    commonVersions: ['4.4.3', '4.3.6']
  }
];

export class AdvancedServiceDetector {
  private static vulnerabilityDatabase: Record<string, ServiceVulnerability[]> = {
    'Apache HTTP Server': [
      {
        id: 'apache-version-disclosure',
        severity: 'low',
        title: 'Server Version Disclosure',
        description: 'Apache server version is disclosed in HTTP headers',
        cvss: 2.6
      }
    ],
    'nginx': [
      {
        id: 'nginx-version-disclosure',
        severity: 'low',
        title: 'Server Version Disclosure',
        description: 'nginx server version is disclosed in HTTP headers',
        cvss: 2.6
      }
    ],
    'OpenSSH': [
      {
        id: 'ssh-version-disclosure',
        severity: 'info',
        title: 'SSH Version Disclosure',
        description: 'SSH server version is disclosed during handshake',
        cvss: 0.0
      }
    ]
  };

  static async detectServices(
    target: string,
    openPorts: Array<{ port: number; protocol: 'tcp' | 'udp'; banner?: string }>
  ): Promise<DetectedService[]> {
    const detectedServices: DetectedService[] = [];

    for (const portInfo of openPorts) {
      try {
        const service = await this.analyzeService(target, portInfo);
        if (service) {
          detectedServices.push(service);
        }
      } catch (error) {
        console.error(`Error detecting service on port ${portInfo.port}:`, error);
      }
    }

    return detectedServices;
  }

  private static async analyzeService(
    target: string,
    portInfo: { port: number; protocol: 'tcp' | 'udp'; banner?: string }
  ): Promise<DetectedService | null> {
    const { port, protocol, banner } = portInfo;
    
    // Get fresh banner if not provided
    const serviceBanner = banner || await this.grabServiceBanner(target, port);
    
    // Find matching service signatures
    const matches = this.findServiceMatches(port, serviceBanner);
    
    if (matches.length === 0) {
      // Return generic service info
      return {
        port,
        protocol,
        name: this.getGenericServiceName(port),
        banner: serviceBanner,
        confidence: 50,
        category: 'other',
        secure: this.isSecurePort(port),
        methods: ['port-based'],
        vulnerabilities: []
      };
    }

    // Use the best match
    const bestMatch = matches[0];
    const versionInfo = this.extractVersionInfo(serviceBanner, bestMatch);
    
    return {
      port,
      protocol,
      name: bestMatch.name,
      product: versionInfo.product,
      version: versionInfo.version,
      extraInfo: versionInfo.extraInfo,
      osType: this.inferOSFromService(bestMatch.name, serviceBanner),
      banner: serviceBanner,
      confidence: bestMatch.confidence,
      category: bestMatch.category,
      secure: bestMatch.secure || this.isSecurePort(port),
      cpe: this.generateCPE(bestMatch.name, versionInfo.version),
      vulnerabilities: this.getServiceVulnerabilities(bestMatch.name, versionInfo.version),
      methods: ['banner-analysis', 'signature-matching']
    };
  }

  private static async grabServiceBanner(target: string, port: number): Promise<string | undefined> {
    // Enhanced banner grabbing for different service types
    
    if ([80, 443, 8080, 8443, 8000, 3000, 5000, 9000].includes(port)) {
      return await this.grabHTTPBanner(target, port);
    }
    
    if (port === 22) {
      return await this.grabSSHBanner(target, port);
    }
    
    if ([21, 25, 110, 143, 993, 995].includes(port)) {
      return await this.grabTextProtocolBanner(target, port);
    }
    
    return undefined;
  }

  private static async grabHTTPBanner(target: string, port: number): Promise<string | undefined> {
    try {
      const protocol = [443, 8443].includes(port) ? 'https' : 'http';
      const response = await fetch(`${protocol}://${target}:${port}`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
        headers: {
          'User-Agent': 'NetProbe/3.0 Service-Detection',
        }
      });

      const headers: string[] = [];
      
      // Collect relevant headers
      const server = response.headers.get('Server');
      const poweredBy = response.headers.get('X-Powered-By');
      const aspNet = response.headers.get('X-AspNet-Version');
      const generator = response.headers.get('X-Generator');
      const framework = response.headers.get('X-Framework');
      
      if (server) headers.push(`Server: ${server}`);
      if (poweredBy) headers.push(`X-Powered-By: ${poweredBy}`);
      if (aspNet) headers.push(`X-AspNet-Version: ${aspNet}`);
      if (generator) headers.push(`X-Generator: ${generator}`);
      if (framework) headers.push(`X-Framework: ${framework}`);
      
      // Try to get additional info from response
      try {
        const fullResponse = await fetch(`${protocol}://${target}:${port}`, {
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        });
        
        const text = await fullResponse.text();
        
        // Look for common CMS/framework signatures in HTML
        const htmlSignatures = [
          /WordPress/i,
          /Drupal/i,
          /Joomla/i,
          /Django/i,
          /Laravel/i,
          /React/i,
          /Angular/i,
          /Vue\.js/i
        ];
        
        for (const signature of htmlSignatures) {
          if (signature.test(text)) {
            headers.push(`Content-Signature: ${signature.source}`);
          }
        }
      } catch (error) {
        // Ignore content fetch errors
      }
      
      return headers.length > 0 ? headers.join('\n') : 'HTTP service detected';
    } catch (error) {
      return undefined;
    }
  }

  private static async grabSSHBanner(target: string, port: number): Promise<string | undefined> {
    // SSH banner grabbing is limited in browsers, but we can try WebSocket
    try {
      return new Promise((resolve) => {
        const ws = new WebSocket(`ws://${target}:${port}`);
        const timeout = setTimeout(() => {
          ws.close();
          resolve('SSH service detected');
        }, 3000);

        ws.onmessage = (event) => {
          clearTimeout(timeout);
          ws.close();
          resolve(event.data || 'SSH service detected');
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          resolve('SSH service detected');
        };
      });
    } catch (error) {
      return 'SSH service detected';
    }
  }

  private static async grabTextProtocolBanner(target: string, port: number): Promise<string | undefined> {
    // Limited text protocol banner grabbing via WebSocket
    try {
      return new Promise((resolve) => {
        const ws = new WebSocket(`ws://${target}:${port}`);
        const timeout = setTimeout(() => {
          ws.close();
          resolve(`Service on port ${port}`);
        }, 2000);

        ws.onopen = () => {
          // Send common protocol greetings
          if (port === 21) ws.send('USER anonymous\r\n');
          if (port === 25) ws.send('HELO netprobe\r\n');
          if (port === 110) ws.send('USER test\r\n');
        };

        ws.onmessage = (event) => {
          clearTimeout(timeout);
          ws.close();
          resolve(event.data || `Service on port ${port}`);
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          resolve(`Service on port ${port}`);
        };
      });
    } catch (error) {
      return `Service on port ${port}`;
    }
  }

  private static findServiceMatches(port: number, banner?: string): ServiceSignature[] {
    const matches: Array<ServiceSignature & { score: number }> = [];

    for (const signature of SERVICE_SIGNATURES) {
      let score = 0;

      // Port-based matching
      if (signature.ports.includes(port)) {
        score += 30;
      }

      // Banner-based matching
      if (banner && signature.patterns.length > 0) {
        for (const pattern of signature.patterns) {
          if (pattern.test(banner)) {
            score += signature.confidence;
            break;
          }
        }
      }

      if (score > 0) {
        matches.push({ ...signature, score });
      }
    }

    // Sort by score (highest first)
    return matches.sort((a, b) => b.score - a.score);
  }

  private static extractVersionInfo(banner: string | undefined, signature: ServiceSignature): {
    product?: string;
    version?: string;
    extraInfo?: string;
  } {
    if (!banner) return {};

    const result: { product?: string; version?: string; extraInfo?: string } = {};

    // Try to extract version from banner using signature patterns
    for (const pattern of signature.patterns) {
      const match = banner.match(pattern);
      if (match) {
        result.product = signature.name;
        if (match[1]) {
          result.version = match[1];
        }
        break;
      }
    }

    // Extract additional info
    if (banner.includes('Ubuntu')) result.extraInfo = 'Ubuntu';
    if (banner.includes('CentOS')) result.extraInfo = 'CentOS';
    if (banner.includes('Red Hat')) result.extraInfo = 'Red Hat';
    if (banner.includes('Debian')) result.extraInfo = 'Debian';
    if (banner.includes('Windows')) result.extraInfo = 'Windows';

    return result;
  }

  private static inferOSFromService(serviceName: string, banner?: string): string | undefined {
    if (!banner) return undefined;

    if (banner.includes('Ubuntu')) return 'Linux';
    if (banner.includes('CentOS')) return 'Linux';
    if (banner.includes('Red Hat')) return 'Linux';
    if (banner.includes('Debian')) return 'Linux';
    if (banner.includes('Windows')) return 'Windows';
    if (banner.includes('Microsoft')) return 'Windows';
    if (banner.includes('IIS')) return 'Windows';

    // Service-based OS inference
    if (serviceName.includes('Microsoft')) return 'Windows';
    if (serviceName.includes('IIS')) return 'Windows';
    if (serviceName.includes('Apache') && banner.includes('Unix')) return 'Linux';

    return undefined;
  }

  private static getGenericServiceName(port: number): string {
    const commonPorts: Record<number, string> = {
      21: 'FTP',
      22: 'SSH',
      23: 'Telnet',
      25: 'SMTP',
      53: 'DNS',
      80: 'HTTP',
      110: 'POP3',
      143: 'IMAP',
      443: 'HTTPS',
      445: 'SMB',
      993: 'IMAPS',
      995: 'POP3S',
      1433: 'MSSQL',
      3306: 'MySQL',
      3389: 'RDP',
      5432: 'PostgreSQL',
      5900: 'VNC',
      6379: 'Redis',
      8080: 'HTTP-Proxy',
      27017: 'MongoDB'
    };

    return commonPorts[port] || `Service-${port}`;
  }

  private static isSecurePort(port: number): boolean {
    const securePorts = [22, 443, 993, 995, 8443];
    return securePorts.includes(port);
  }

  private static generateCPE(serviceName: string, version?: string): string[] {
    const cpes: string[] = [];
    
    const serviceMap: Record<string, string> = {
      'Apache HTTP Server': 'apache:http_server',
      'nginx': 'nginx:nginx',
      'Microsoft IIS': 'microsoft:internet_information_server',
      'OpenSSH': 'openbsd:openssh',
      'MySQL': 'oracle:mysql',
      'PostgreSQL': 'postgresql:postgresql'
    };

    const cpeProduct = serviceMap[serviceName];
    if (cpeProduct && version) {
      cpes.push(`cpe:2.3:a:${cpeProduct}:${version}:*:*:*:*:*:*:*`);
    }

    return cpes;
  }

  private static getServiceVulnerabilities(serviceName: string, version?: string): ServiceVulnerability[] {
    const vulns = this.vulnerabilityDatabase[serviceName] || [];
    
    // Filter vulnerabilities based on version if available
    // This is a simplified implementation - in reality, you'd check version ranges
    return vulns;
  }
}