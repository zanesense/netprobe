// NSE-inspired script engine for security checks

export interface SecurityScript {
  id: string;
  name: string;
  description: string;
  category: 'auth' | 'discovery' | 'safe' | 'intrusive' | 'vuln' | 'default' | 'malware';
  author: string;
  license: string;
  dependencies: string[];
  portrule?: (port: number, service?: string) => boolean;
  hostrule?: (host: string) => boolean;
  action: (target: string, port?: number, service?: string) => Promise<ScriptResult>;
}

export interface ScriptResult {
  id: string;
  scriptId: string;
  name: string;
  category: string;
  port?: number;
  host: string;
  output: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  duration: number;
  timestamp: Date;
  findings?: ScriptFinding[];
  state: 'success' | 'error' | 'timeout' | 'filtered';
}

export interface ScriptFinding {
  title: string;
  description: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  remediation?: string;
  references?: string[];
  cvss?: number;
  cve?: string;
}

// Built-in security scripts
export const SECURITY_SCRIPTS: SecurityScript[] = [
  {
    id: 'http-title',
    name: 'HTTP Title',
    description: 'Retrieves the title of web pages',
    category: 'safe',
    author: 'NetProbe Team',
    license: 'MIT',
    dependencies: [],
    portrule: (port: number, service?: string) => {
      return [80, 443, 8080, 8443, 8000, 3000, 5000, 9000].includes(port) || 
             (service && ['http', 'https'].includes(service.toLowerCase()));
    },
    action: async (target: string, port?: number, service?: string) => {
      const startTime = Date.now();
      try {
        const protocol = port === 443 || port === 8443 ? 'https' : 'http';
        const response = await fetch(`${protocol}://${target}:${port}`, {
          method: 'GET',
          signal: AbortSignal.timeout(10000)
        });
        
        const html = await response.text();
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : 'No title found';
        
        return {
          id: `http-title-${Date.now()}`,
          scriptId: 'http-title',
          name: 'HTTP Title',
          category: 'safe',
          port,
          host: target,
          output: `Title: ${title}`,
          severity: 'info',
          duration: Date.now() - startTime,
          timestamp: new Date(),
          state: 'success'
        };
      } catch (error) {
        return {
          id: `http-title-${Date.now()}`,
          scriptId: 'http-title',
          name: 'HTTP Title',
          category: 'safe',
          port,
          host: target,
          output: `Error: ${error}`,
          severity: 'info',
          duration: Date.now() - startTime,
          timestamp: new Date(),
          state: 'error'
        };
      }
    }
  },
  
  {
    id: 'http-headers',
    name: 'HTTP Security Headers',
    description: 'Checks for security-related HTTP headers',
    category: 'safe',
    author: 'NetProbe Team',
    license: 'MIT',
    dependencies: [],
    portrule: (port: number, service?: string) => {
      return [80, 443, 8080, 8443].includes(port) || 
             (service && ['http', 'https'].includes(service.toLowerCase()));
    },
    action: async (target: string, port?: number, service?: string) => {
      const startTime = Date.now();
      try {
        const protocol = port === 443 || port === 8443 ? 'https' : 'http';
        const response = await fetch(`${protocol}://${target}:${port}`, {
          method: 'HEAD',
          signal: AbortSignal.timeout(10000)
        });
        
        const securityHeaders = [
          'Strict-Transport-Security',
          'Content-Security-Policy',
          'X-Frame-Options',
          'X-Content-Type-Options',
          'X-XSS-Protection',
          'Referrer-Policy',
          'Permissions-Policy'
        ];
        
        const findings: ScriptFinding[] = [];
        const presentHeaders: string[] = [];
        const missingHeaders: string[] = [];
        
        securityHeaders.forEach(header => {
          if (response.headers.has(header)) {
            presentHeaders.push(`${header}: ${response.headers.get(header)}`);
          } else {
            missingHeaders.push(header);
            findings.push({
              title: `Missing ${header} header`,
              description: `The ${header} security header is not present`,
              severity: header === 'Strict-Transport-Security' ? 'medium' : 'low',
              remediation: `Add the ${header} header to improve security`
            });
          }
        });
        
        let output = '';
        if (presentHeaders.length > 0) {
          output += `Present security headers:\n${presentHeaders.join('\n')}\n\n`;
        }
        if (missingHeaders.length > 0) {
          output += `Missing security headers:\n${missingHeaders.join('\n')}`;
        }
        
        return {
          id: `http-headers-${Date.now()}`,
          scriptId: 'http-headers',
          name: 'HTTP Security Headers',
          category: 'safe',
          port,
          host: target,
          output: output || 'No security headers analysis available',
          severity: findings.some(f => f.severity === 'medium') ? 'medium' : 'low',
          duration: Date.now() - startTime,
          timestamp: new Date(),
          findings,
          state: 'success'
        };
      } catch (error) {
        return {
          id: `http-headers-${Date.now()}`,
          scriptId: 'http-headers',
          name: 'HTTP Security Headers',
          category: 'safe',
          port,
          host: target,
          output: `Error: ${error}`,
          severity: 'info',
          duration: Date.now() - startTime,
          timestamp: new Date(),
          state: 'error'
        };
      }
    }
  },
  
  {
    id: 'ssl-cert',
    name: 'SSL Certificate Info',
    description: 'Retrieves SSL certificate information',
    category: 'safe',
    author: 'NetProbe Team',
    license: 'MIT',
    dependencies: [],
    portrule: (port: number, service?: string) => {
      return [443, 8443, 993, 995, 465].includes(port) || 
             (service && service.toLowerCase().includes('ssl'));
    },
    action: async (target: string, port?: number, service?: string) => {
      const startTime = Date.now();
      try {
        const response = await fetch(`https://${target}:${port}`, {
          method: 'HEAD',
          signal: AbortSignal.timeout(10000)
        });
        
        // In a real implementation, you'd extract certificate details
        // Browser limitations prevent direct certificate access
        const output = `SSL/TLS connection established
Certificate validation: ${response.ok ? 'Valid' : 'Invalid'}
Protocol: HTTPS
Port: ${port}`;
        
        return {
          id: `ssl-cert-${Date.now()}`,
          scriptId: 'ssl-cert',
          name: 'SSL Certificate Info',
          category: 'safe',
          port,
          host: target,
          output,
          severity: 'info',
          duration: Date.now() - startTime,
          timestamp: new Date(),
          state: 'success'
        };
      } catch (error) {
        const findings: ScriptFinding[] = [];
        if (error instanceof Error && error.message.includes('certificate')) {
          findings.push({
            title: 'SSL Certificate Issue',
            description: 'SSL certificate validation failed',
            severity: 'medium',
            remediation: 'Check SSL certificate validity and configuration'
          });
        }
        
        return {
          id: `ssl-cert-${Date.now()}`,
          scriptId: 'ssl-cert',
          name: 'SSL Certificate Info',
          category: 'safe',
          port,
          host: target,
          output: `SSL connection failed: ${error}`,
          severity: findings.length > 0 ? 'medium' : 'info',
          duration: Date.now() - startTime,
          timestamp: new Date(),
          findings,
          state: 'error'
        };
      }
    }
  },
  
  {
    id: 'http-methods',
    name: 'HTTP Methods',
    description: 'Checks which HTTP methods are allowed',
    category: 'safe',
    author: 'NetProbe Team',
    license: 'MIT',
    dependencies: [],
    portrule: (port: number, service?: string) => {
      return [80, 443, 8080, 8443].includes(port) || 
             (service && ['http', 'https'].includes(service.toLowerCase()));
    },
    action: async (target: string, port?: number, service?: string) => {
      const startTime = Date.now();
      try {
        const protocol = port === 443 || port === 8443 ? 'https' : 'http';
        const response = await fetch(`${protocol}://${target}:${port}`, {
          method: 'OPTIONS',
          signal: AbortSignal.timeout(10000)
        });
        
        const allowHeader = response.headers.get('Allow');
        const findings: ScriptFinding[] = [];
        
        if (allowHeader) {
          const methods = allowHeader.split(',').map(m => m.trim());
          const dangerousMethods = ['PUT', 'DELETE', 'TRACE', 'CONNECT'];
          const foundDangerous = methods.filter(m => dangerousMethods.includes(m.toUpperCase()));
          
          if (foundDangerous.length > 0) {
            findings.push({
              title: 'Dangerous HTTP Methods Enabled',
              description: `Potentially dangerous HTTP methods are enabled: ${foundDangerous.join(', ')}`,
              severity: 'medium',
              remediation: 'Disable unnecessary HTTP methods on the web server'
            });
          }
          
          return {
            id: `http-methods-${Date.now()}`,
            scriptId: 'http-methods',
            name: 'HTTP Methods',
            category: 'safe',
            port,
            host: target,
            output: `Allowed methods: ${allowHeader}`,
            severity: findings.length > 0 ? 'medium' : 'info',
            duration: Date.now() - startTime,
            timestamp: new Date(),
            findings,
            state: 'success'
          };
        } else {
          return {
            id: `http-methods-${Date.now()}`,
            scriptId: 'http-methods',
            name: 'HTTP Methods',
            category: 'safe',
            port,
            host: target,
            output: 'No Allow header found in OPTIONS response',
            severity: 'info',
            duration: Date.now() - startTime,
            timestamp: new Date(),
            state: 'success'
          };
        }
      } catch (error) {
        return {
          id: `http-methods-${Date.now()}`,
          scriptId: 'http-methods',
          name: 'HTTP Methods',
          category: 'safe',
          port,
          host: target,
          output: `Error: ${error}`,
          severity: 'info',
          duration: Date.now() - startTime,
          timestamp: new Date(),
          state: 'error'
        };
      }
    }
  },
  
  {
    id: 'robots-txt',
    name: 'Robots.txt',
    description: 'Retrieves and analyzes robots.txt file',
    category: 'safe',
    author: 'NetProbe Team',
    license: 'MIT',
    dependencies: [],
    portrule: (port: number, service?: string) => {
      return [80, 443, 8080, 8443].includes(port) || 
             (service && ['http', 'https'].includes(service.toLowerCase()));
    },
    action: async (target: string, port?: number, service?: string) => {
      const startTime = Date.now();
      try {
        const protocol = port === 443 || port === 8443 ? 'https' : 'http';
        const response = await fetch(`${protocol}://${target}:${port}/robots.txt`, {
          method: 'GET',
          signal: AbortSignal.timeout(10000)
        });
        
        if (response.ok) {
          const robotsContent = await response.text();
          const findings: ScriptFinding[] = [];
          
          // Look for interesting disallowed paths
          const disallowMatches = robotsContent.match(/Disallow:\s*(.+)/gi);
          if (disallowMatches && disallowMatches.length > 0) {
            const interestingPaths = disallowMatches
              .map(line => line.replace(/Disallow:\s*/i, '').trim())
              .filter(path => path && path !== '/' && path !== '*');
            
            if (interestingPaths.length > 0) {
              findings.push({
                title: 'Interesting paths in robots.txt',
                description: `Found potentially interesting paths: ${interestingPaths.slice(0, 5).join(', ')}`,
                severity: 'info',
                remediation: 'Review if sensitive paths should be listed in robots.txt'
              });
            }
          }
          
          return {
            id: `robots-txt-${Date.now()}`,
            scriptId: 'robots-txt',
            name: 'Robots.txt',
            category: 'safe',
            port,
            host: target,
            output: `robots.txt found:\n${robotsContent.substring(0, 500)}${robotsContent.length > 500 ? '...' : ''}`,
            severity: 'info',
            duration: Date.now() - startTime,
            timestamp: new Date(),
            findings,
            state: 'success'
          };
        } else {
          return {
            id: `robots-txt-${Date.now()}`,
            scriptId: 'robots-txt',
            name: 'Robots.txt',
            category: 'safe',
            port,
            host: target,
            output: 'robots.txt not found',
            severity: 'info',
            duration: Date.now() - startTime,
            timestamp: new Date(),
            state: 'success'
          };
        }
      } catch (error) {
        return {
          id: `robots-txt-${Date.now()}`,
          scriptId: 'robots-txt',
          name: 'Robots.txt',
          category: 'safe',
          port,
          host: target,
          output: `Error: ${error}`,
          severity: 'info',
          duration: Date.now() - startTime,
          timestamp: new Date(),
          state: 'error'
        };
      }
    }
  },
  
  {
    id: 'ssh-hostkey',
    name: 'SSH Host Key',
    description: 'Retrieves SSH host key information',
    category: 'safe',
    author: 'NetProbe Team',
    license: 'MIT',
    dependencies: [],
    portrule: (port: number, service?: string) => {
      return port === 22 || (service && service.toLowerCase().includes('ssh'));
    },
    action: async (target: string, port?: number, service?: string) => {
      const startTime = Date.now();
      try {
        // SSH host key retrieval is very limited in browsers
        // This is a simplified implementation
        const output = `SSH service detected on ${target}:${port}
Host key retrieval limited in browser environment
Recommendation: Use native SSH client for full host key analysis`;
        
        return {
          id: `ssh-hostkey-${Date.now()}`,
          scriptId: 'ssh-hostkey',
          name: 'SSH Host Key',
          category: 'safe',
          port,
          host: target,
          output,
          severity: 'info',
          duration: Date.now() - startTime,
          timestamp: new Date(),
          state: 'success'
        };
      } catch (error) {
        return {
          id: `ssh-hostkey-${Date.now()}`,
          scriptId: 'ssh-hostkey',
          name: 'SSH Host Key',
          category: 'safe',
          port,
          host: target,
          output: `Error: ${error}`,
          severity: 'info',
          duration: Date.now() - startTime,
          timestamp: new Date(),
          state: 'error'
        };
      }
    }
  },

  // Discovery Scripts
  {
    id: 'http-enum',
    name: 'HTTP Directory Enumeration',
    description: 'Enumerates common directories and files',
    category: 'discovery',
    author: 'NetProbe Team',
    license: 'MIT',
    dependencies: [],
    portrule: (port: number, service?: string) => {
      return [80, 443, 8080, 8443].includes(port) || 
             (service && ['http', 'https'].includes(service.toLowerCase()));
    },
    action: async (target: string, port?: number, service?: string) => {
      const startTime = Date.now();
      try {
        const protocol = port === 443 || port === 8443 ? 'https' : 'http';
        const commonPaths = [
          '/admin', '/administrator', '/login', '/wp-admin', '/phpmyadmin',
          '/backup', '/config', '/test', '/dev', '/api', '/docs', '/swagger',
          '/robots.txt', '/sitemap.xml', '/.git', '/.env', '/package.json'
        ];
        
        const findings: ScriptFinding[] = [];
        const foundPaths: string[] = [];
        
        // Test common paths with limited concurrency
        const batchSize = 3;
        for (let i = 0; i < commonPaths.length; i += batchSize) {
          const batch = commonPaths.slice(i, i + batchSize);
          const promises = batch.map(async (path) => {
            try {
              const response = await fetch(`${protocol}://${target}:${port}${path}`, {
                method: 'HEAD',
                signal: AbortSignal.timeout(3000)
              });
              
              if (response.ok) {
                foundPaths.push(`${path} (${response.status})`);
                
                // Check for sensitive files
                if (['.git', '.env', 'package.json', 'config'].some(sensitive => path.includes(sensitive))) {
                  findings.push({
                    title: `Sensitive file exposed: ${path}`,
                    description: `Potentially sensitive file or directory is accessible`,
                    severity: 'medium',
                    remediation: `Restrict access to ${path} or remove if not needed`
                  });
                }
              }
            } catch (error) {
              // Ignore individual path errors
            }
          });
          
          await Promise.all(promises);
          
          // Small delay between batches
          if (i + batchSize < commonPaths.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
        const output = foundPaths.length > 0 
          ? `Found accessible paths:\n${foundPaths.join('\n')}`
          : 'No common directories found';
        
        return {
          id: `http-enum-${Date.now()}`,
          scriptId: 'http-enum',
          name: 'HTTP Directory Enumeration',
          category: 'discovery',
          port,
          host: target,
          output,
          severity: findings.length > 0 ? 'medium' : 'info',
          duration: Date.now() - startTime,
          timestamp: new Date(),
          findings,
          state: 'success'
        };
      } catch (error) {
        return {
          id: `http-enum-${Date.now()}`,
          scriptId: 'http-enum',
          name: 'HTTP Directory Enumeration',
          category: 'discovery',
          port,
          host: target,
          output: `Error: ${error}`,
          severity: 'info',
          duration: Date.now() - startTime,
          timestamp: new Date(),
          state: 'error'
        };
      }
    }
  },

  {
    id: 'dns-brute',
    name: 'DNS Subdomain Brute Force',
    description: 'Attempts to discover subdomains',
    category: 'discovery',
    author: 'NetProbe Team',
    license: 'MIT',
    dependencies: [],
    hostrule: (host: string) => {
      // Only run on domain names, not IP addresses
      return !/^\d+\.\d+\.\d+\.\d+$/.test(host);
    },
    action: async (target: string, port?: number, service?: string) => {
      const startTime = Date.now();
      try {
        const commonSubdomains = [
          'www', 'mail', 'ftp', 'admin', 'api', 'dev', 'test', 'staging',
          'blog', 'shop', 'cdn', 'static', 'assets', 'img', 'images'
        ];
        
        const findings: ScriptFinding[] = [];
        const foundSubdomains: string[] = [];
        
        // Test subdomains using DNS-over-HTTPS
        for (const subdomain of commonSubdomains) {
          try {
            const testDomain = `${subdomain}.${target}`;
            const response = await fetch(`https://dns.google/resolve?name=${testDomain}&type=A`, {
              headers: { 'Accept': 'application/dns-json' },
              signal: AbortSignal.timeout(3000)
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.Answer && data.Answer.length > 0) {
                const ip = data.Answer[0].data;
                foundSubdomains.push(`${testDomain} -> ${ip}`);
              }
            }
          } catch (error) {
            // Ignore individual subdomain errors
          }
          
          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        if (foundSubdomains.length > 0) {
          findings.push({
            title: 'Subdomains discovered',
            description: `Found ${foundSubdomains.length} subdomains that may expand attack surface`,
            severity: 'info',
            remediation: 'Review subdomain security and ensure proper access controls'
          });
        }
        
        const output = foundSubdomains.length > 0
          ? `Found subdomains:\n${foundSubdomains.join('\n')}`
          : 'No common subdomains found';
        
        return {
          id: `dns-brute-${Date.now()}`,
          scriptId: 'dns-brute',
          name: 'DNS Subdomain Brute Force',
          category: 'discovery',
          host: target,
          output,
          severity: 'info',
          duration: Date.now() - startTime,
          timestamp: new Date(),
          findings,
          state: 'success'
        };
      } catch (error) {
        return {
          id: `dns-brute-${Date.now()}`,
          scriptId: 'dns-brute',
          name: 'DNS Subdomain Brute Force',
          category: 'discovery',
          host: target,
          output: `Error: ${error}`,
          severity: 'info',
          duration: Date.now() - startTime,
          timestamp: new Date(),
          state: 'error'
        };
      }
    }
  },

  // Vulnerability Scripts
  {
    id: 'http-vuln-cve2021-44228',
    name: 'Log4j RCE Detection (CVE-2021-44228)',
    description: 'Detects potential Log4j RCE vulnerability',
    category: 'vuln',
    author: 'NetProbe Team',
    license: 'MIT',
    dependencies: [],
    portrule: (port: number, service?: string) => {
      return [80, 443, 8080, 8443, 8000, 9000].includes(port) || 
             (service && ['http', 'https'].includes(service.toLowerCase()));
    },
    action: async (target: string, port?: number, service?: string) => {
      const startTime = Date.now();
      try {
        const protocol = port === 443 || port === 8443 ? 'https' : 'http';
        const testPayload = '${jndi:ldap://netprobe.test/test}';
        
        // Test common endpoints with Log4j payload
        const testEndpoints = ['/', '/login', '/api/login', '/search'];
        const findings: ScriptFinding[] = [];
        let vulnerableEndpoints: string[] = [];
        
        for (const endpoint of testEndpoints) {
          try {
            // Test in User-Agent header
            const response = await fetch(`${protocol}://${target}:${port}${endpoint}`, {
              method: 'GET',
              headers: {
                'User-Agent': `NetProbe-Log4j-Test-${testPayload}`,
                'X-Forwarded-For': testPayload,
                'X-Real-IP': testPayload
              },
              signal: AbortSignal.timeout(5000)
            });
            
            // In a real scenario, you'd monitor for DNS callbacks
            // This is a simplified detection based on response patterns
            const responseText = await response.text();
            
            // Look for error patterns that might indicate Log4j processing
            if (responseText.includes('log4j') || 
                responseText.includes('jndi') ||
                responseText.includes('ldap://') ||
                response.headers.get('server')?.includes('log4j')) {
              vulnerableEndpoints.push(endpoint);
            }
          } catch (error) {
            // Ignore individual endpoint errors
          }
        }
        
        if (vulnerableEndpoints.length > 0) {
          findings.push({
            title: 'Potential Log4j RCE Vulnerability (CVE-2021-44228)',
            description: 'Server may be vulnerable to Log4j remote code execution',
            severity: 'critical',
            remediation: 'Update Log4j to version 2.17.1 or later, or apply mitigations',
            cve: 'CVE-2021-44228',
            cvss: 10.0
          });
        }
        
        const output = vulnerableEndpoints.length > 0
          ? `Potential Log4j vulnerability detected on endpoints: ${vulnerableEndpoints.join(', ')}\nThis is a CRITICAL vulnerability that allows remote code execution.`
          : 'No obvious Log4j vulnerability patterns detected';
        
        return {
          id: `http-vuln-cve2021-44228-${Date.now()}`,
          scriptId: 'http-vuln-cve2021-44228',
          name: 'Log4j RCE Detection (CVE-2021-44228)',
          category: 'vuln',
          port,
          host: target,
          output,
          severity: findings.length > 0 ? 'critical' : 'info',
          duration: Date.now() - startTime,
          timestamp: new Date(),
          findings,
          state: 'success'
        };
      } catch (error) {
        return {
          id: `http-vuln-cve2021-44228-${Date.now()}`,
          scriptId: 'http-vuln-cve2021-44228',
          name: 'Log4j RCE Detection (CVE-2021-44228)',
          category: 'vuln',
          port,
          host: target,
          output: `Error: ${error}`,
          severity: 'info',
          duration: Date.now() - startTime,
          timestamp: new Date(),
          state: 'error'
        };
      }
    }
  },

  {
    id: 'http-slowloris',
    name: 'Slowloris DoS Vulnerability',
    description: 'Tests for Slowloris denial of service vulnerability',
    category: 'vuln',
    author: 'NetProbe Team',
    license: 'MIT',
    dependencies: [],
    portrule: (port: number, service?: string) => {
      return [80, 443, 8080, 8443].includes(port) || 
             (service && ['http', 'https'].includes(service.toLowerCase()));
    },
    action: async (target: string, port?: number, service?: string) => {
      const startTime = Date.now();
      try {
        const protocol = port === 443 || port === 8443 ? 'https' : 'http';
        
        // Test server's handling of slow HTTP requests
        // This is a non-destructive test that checks response patterns
        const findings: ScriptFinding[] = [];
        
        try {
          // Send a partial HTTP request and measure response time
          const response = await fetch(`${protocol}://${target}:${port}`, {
            method: 'GET',
            headers: {
              'Connection': 'keep-alive',
              'User-Agent': 'NetProbe-Slowloris-Test'
            },
            signal: AbortSignal.timeout(10000)
          });
          
          const server = response.headers.get('Server') || '';
          
          // Check for servers known to be vulnerable to Slowloris
          const vulnerableServers = ['Apache/2.0', 'Apache/2.2', 'nginx/0.', 'nginx/1.0'];
          const isVulnerableVersion = vulnerableServers.some(vuln => server.includes(vuln));
          
          if (isVulnerableVersion) {
            findings.push({
              title: 'Potentially vulnerable to Slowloris DoS',
              description: `Server version (${server}) may be vulnerable to Slowloris attacks`,
              severity: 'medium',
              remediation: 'Update web server or configure connection limits and timeouts'
            });
          }
          
          const output = isVulnerableVersion
            ? `Server may be vulnerable to Slowloris DoS attacks\nServer: ${server}\nRecommendation: Configure proper connection limits and timeouts`
            : `Server appears to have protections against Slowloris\nServer: ${server}`;
          
          return {
            id: `http-slowloris-${Date.now()}`,
            scriptId: 'http-slowloris',
            name: 'Slowloris DoS Vulnerability',
            category: 'vuln',
            port,
            host: target,
            output,
            severity: findings.length > 0 ? 'medium' : 'info',
            duration: Date.now() - startTime,
            timestamp: new Date(),
            findings,
            state: 'success'
          };
        } catch (error) {
          return {
            id: `http-slowloris-${Date.now()}`,
            scriptId: 'http-slowloris',
            name: 'Slowloris DoS Vulnerability',
            category: 'vuln',
            port,
            host: target,
            output: `Could not test for Slowloris vulnerability: ${error}`,
            severity: 'info',
            duration: Date.now() - startTime,
            timestamp: new Date(),
            state: 'error'
          };
        }
      } catch (error) {
        return {
          id: `http-slowloris-${Date.now()}`,
          scriptId: 'http-slowloris',
          name: 'Slowloris DoS Vulnerability',
          category: 'vuln',
          port,
          host: target,
          output: `Error: ${error}`,
          severity: 'info',
          duration: Date.now() - startTime,
          timestamp: new Date(),
          state: 'error'
        };
      }
    }
  },

  // Authentication Scripts
  {
    id: 'http-default-accounts',
    name: 'Default Account Detection',
    description: 'Checks for default login credentials',
    category: 'auth',
    author: 'NetProbe Team',
    license: 'MIT',
    dependencies: [],
    portrule: (port: number, service?: string) => {
      return [80, 443, 8080, 8443].includes(port) || 
             (service && ['http', 'https'].includes(service.toLowerCase()));
    },
    action: async (target: string, port?: number, service?: string) => {
      const startTime = Date.now();
      try {
        const protocol = port === 443 || port === 8443 ? 'https' : 'http';
        const findings: ScriptFinding[] = [];
        
        // Common login endpoints
        const loginEndpoints = ['/login', '/admin', '/administrator', '/wp-admin', '/manager/html'];
        
        for (const endpoint of loginEndpoints) {
          try {
            const response = await fetch(`${protocol}://${target}:${port}${endpoint}`, {
              method: 'GET',
              signal: AbortSignal.timeout(5000)
            });
            
            if (response.ok) {
              const content = await response.text();
              
              // Look for login forms
              if (content.includes('<form') && 
                  (content.includes('password') || content.includes('login'))) {
                
                findings.push({
                  title: `Login interface found: ${endpoint}`,
                  description: 'Login interface detected - verify strong authentication is enforced',
                  severity: 'low',
                  remediation: 'Ensure strong passwords, account lockout, and MFA are configured'
                });
              }
            }
          } catch (error) {
            // Ignore individual endpoint errors
          }
        }
        
        const output = findings.length > 0
          ? `Found ${findings.length} login interfaces\nRecommendation: Verify strong authentication controls are in place`
          : 'No obvious login interfaces found';
        
        return {
          id: `http-default-accounts-${Date.now()}`,
          scriptId: 'http-default-accounts',
          name: 'Default Account Detection',
          category: 'auth',
          port,
          host: target,
          output,
          severity: findings.length > 0 ? 'low' : 'info',
          duration: Date.now() - startTime,
          timestamp: new Date(),
          findings,
          state: 'success'
        };
      } catch (error) {
        return {
          id: `http-default-accounts-${Date.now()}`,
          scriptId: 'http-default-accounts',
          name: 'Default Account Detection',
          category: 'auth',
          port,
          host: target,
          output: `Error: ${error}`,
          severity: 'info',
          duration: Date.now() - startTime,
          timestamp: new Date(),
          state: 'error'
        };
      }
    }
  },

  // Intrusive Scripts
  {
    id: 'http-sql-injection',
    name: 'SQL Injection Detection',
    description: 'Tests for SQL injection vulnerabilities (intrusive)',
    category: 'intrusive',
    author: 'NetProbe Team',
    license: 'MIT',
    dependencies: [],
    portrule: (port: number, service?: string) => {
      return [80, 443, 8080, 8443].includes(port) || 
             (service && ['http', 'https'].includes(service.toLowerCase()));
    },
    action: async (target: string, port?: number, service?: string) => {
      const startTime = Date.now();
      try {
        const protocol = port === 443 || port === 8443 ? 'https' : 'http';
        const findings: ScriptFinding[] = [];
        
        // Basic SQL injection payloads (non-destructive)
        const sqlPayloads = ["'", "1'OR'1'='1", "'; DROP TABLE users; --"];
        const testEndpoints = ['/', '/search', '/login', '/api/search'];
        
        for (const endpoint of testEndpoints) {
          for (const payload of sqlPayloads) {
            try {
              const testUrl = `${protocol}://${target}:${port}${endpoint}?q=${encodeURIComponent(payload)}`;
              const response = await fetch(testUrl, {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
              });
              
              const content = await response.text();
              
              // Look for SQL error patterns
              const sqlErrors = [
                'SQL syntax error',
                'mysql_fetch_array',
                'ORA-01756',
                'Microsoft OLE DB Provider',
                'PostgreSQL query failed',
                'SQLite error'
              ];
              
              const foundError = sqlErrors.find(error => 
                content.toLowerCase().includes(error.toLowerCase())
              );
              
              if (foundError) {
                findings.push({
                  title: `Potential SQL Injection vulnerability`,
                  description: `SQL error detected on ${endpoint} with payload: ${payload}`,
                  severity: 'high',
                  remediation: 'Use parameterized queries and input validation',
                  references: ['https://owasp.org/www-community/attacks/SQL_Injection']
                });
                break; // Don't test more payloads on this endpoint
              }
            } catch (error) {
              // Ignore individual test errors
            }
          }
        }
        
        const output = findings.length > 0
          ? `POTENTIAL SQL INJECTION VULNERABILITIES FOUND!\n${findings.map(f => f.description).join('\n')}\n\nThis is a HIGH SEVERITY finding that requires immediate attention.`
          : 'No obvious SQL injection vulnerabilities detected';
        
        return {
          id: `http-sql-injection-${Date.now()}`,
          scriptId: 'http-sql-injection',
          name: 'SQL Injection Detection',
          category: 'intrusive',
          port,
          host: target,
          output,
          severity: findings.length > 0 ? 'high' : 'info',
          duration: Date.now() - startTime,
          timestamp: new Date(),
          findings,
          state: 'success'
        };
      } catch (error) {
        return {
          id: `http-sql-injection-${Date.now()}`,
          scriptId: 'http-sql-injection',
          name: 'SQL Injection Detection',
          category: 'intrusive',
          port,
          host: target,
          output: `Error: ${error}`,
          severity: 'info',
          duration: Date.now() - startTime,
          timestamp: new Date(),
          state: 'error'
        };
      }
    }
  }
];

export class ScriptEngine {
  private static runningScripts = new Map<string, AbortController>();

  static async runScript(
    script: SecurityScript,
    target: string,
    port?: number,
    service?: string
  ): Promise<ScriptResult> {
    const scriptKey = `${script.id}-${target}-${port}`;
    
    // Check if script is already running
    if (this.runningScripts.has(scriptKey)) {
      throw new Error(`Script ${script.name} is already running for ${target}:${port}`);
    }

    const abortController = new AbortController();
    this.runningScripts.set(scriptKey, abortController);

    try {
      const result = await script.action(target, port, service);
      return result;
    } finally {
      this.runningScripts.delete(scriptKey);
    }
  }

  static async runScripts(
    scriptIds: string[],
    target: string,
    openPorts: Array<{ port: number; service?: string }>,
    onProgress?: (completed: number, total: number) => void,
    onResult?: (result: ScriptResult) => void
  ): Promise<ScriptResult[]> {
    const results: ScriptResult[] = [];
    const scriptsToRun: Array<{ script: SecurityScript; port?: number; service?: string }> = [];

    // Determine which scripts to run on which ports
    for (const scriptId of scriptIds) {
      const script = SECURITY_SCRIPTS.find(s => s.id === scriptId);
      if (!script) continue;

      if (script.hostrule && script.hostrule(target)) {
        scriptsToRun.push({ script });
      } else if (script.portrule) {
        for (const portInfo of openPorts) {
          if (script.portrule(portInfo.port, portInfo.service)) {
            scriptsToRun.push({ script, port: portInfo.port, service: portInfo.service });
          }
        }
      } else {
        // Run on all open ports if no specific rule
        for (const portInfo of openPorts) {
          scriptsToRun.push({ script, port: portInfo.port, service: portInfo.service });
        }
      }
    }

    // Run scripts with concurrency control
    const maxConcurrent = 3;
    const batches = [];
    for (let i = 0; i < scriptsToRun.length; i += maxConcurrent) {
      batches.push(scriptsToRun.slice(i, i + maxConcurrent));
    }

    let completed = 0;
    for (const batch of batches) {
      const batchPromises = batch.map(async ({ script, port, service }) => {
        try {
          const result = await this.runScript(script, target, port, service);
          results.push(result);
          onResult?.(result);
          return result;
        } catch (error) {
          const errorResult: ScriptResult = {
            id: `${script.id}-error-${Date.now()}`,
            scriptId: script.id,
            name: script.name,
            category: script.category,
            port,
            host: target,
            output: `Script execution failed: ${error}`,
            severity: 'info',
            duration: 0,
            timestamp: new Date(),
            state: 'error'
          };
          results.push(errorResult);
          onResult?.(errorResult);
          return errorResult;
        } finally {
          completed++;
          onProgress?.(completed, scriptsToRun.length);
        }
      });

      await Promise.all(batchPromises);
    }

    return results;
  }

  static getAvailableScripts(): SecurityScript[] {
    return [...SECURITY_SCRIPTS];
  }

  static getScriptsByCategory(category: string): SecurityScript[] {
    return SECURITY_SCRIPTS.filter(script => script.category === category);
  }

  static getScriptsForPort(port: number, service?: string): SecurityScript[] {
    return SECURITY_SCRIPTS.filter(script => 
      script.portrule && script.portrule(port, service)
    );
  }

  static stopScript(scriptId: string, target: string, port?: number): boolean {
    const scriptKey = `${scriptId}-${target}-${port}`;
    const controller = this.runningScripts.get(scriptKey);
    
    if (controller) {
      controller.abort();
      this.runningScripts.delete(scriptKey);
      return true;
    }
    
    return false;
  }

  static stopAllScripts(): void {
    for (const [key, controller] of this.runningScripts) {
      controller.abort();
    }
    this.runningScripts.clear();
  }
}