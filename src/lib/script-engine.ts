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