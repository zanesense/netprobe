// Advanced firewall and filtering detection

export interface FirewallAnalysis {
  detected: boolean;
  type?: 'stateful' | 'packet-filter' | 'proxy' | 'ids-ips' | 'waf' | 'unknown';
  confidence: number;
  indicators: string[];
  avgResponseTime: number;
  responseVariance: number;
  rateLimitDetected: boolean;
  droppedPackets: number;
  resetResponses: number;
  icmpUnreachable: number;
  fingerprint?: string;
  bypassTechniques?: string[];
  recommendations?: string[];
}

export interface PortAnalysis {
  port: number;
  status: 'open' | 'closed' | 'filtered' | 'timeout';
  responseTime: number;
  responseType: 'connection' | 'reset' | 'timeout' | 'icmp-unreachable';
  consistent: boolean;
  rateLimited: boolean;
}

export interface TimingAnalysis {
  min: number;
  max: number;
  avg: number;
  stddev: number;
  samples: number[];
  outliers: number[];
  pattern: 'consistent' | 'variable' | 'rate-limited' | 'random';
}

export class FirewallDetector {
  private static readonly TIMING_SAMPLES = 10;
  private static readonly RATE_LIMIT_THRESHOLD = 1000; // ms
  private static readonly CONSISTENCY_THRESHOLD = 0.8;

  static async analyzeFirewall(
    target: string,
    portResults: Array<{ port: number; status: string; latency: number }>,
    onProgress?: (progress: number) => void
  ): Promise<FirewallAnalysis> {
    const analysis: FirewallAnalysis = {
      detected: false,
      confidence: 0,
      indicators: [],
      avgResponseTime: 0,
      responseVariance: 0,
      rateLimitDetected: false,
      droppedPackets: 0,
      resetResponses: 0,
      icmpUnreachable: 0,
      recommendations: []
    };

    // Analyze existing port scan results
    const portAnalysis = this.analyzePortResponses(portResults);
    
    // Perform additional timing analysis
    onProgress?.(20);
    const timingAnalysis = await this.performTimingAnalysis(target, portResults.slice(0, 5));
    
    // Detect rate limiting
    onProgress?.(40);
    const rateLimitAnalysis = await this.detectRateLimit(target);
    
    // Analyze response patterns
    onProgress?.(60);
    const patternAnalysis = this.analyzeResponsePatterns(portResults);
    
    // Perform stealth detection
    onProgress?.(80);
    const stealthAnalysis = await this.performStealthDetection(target);
    
    // Compile final analysis
    onProgress?.(100);
    return this.compileAnalysis(portAnalysis, timingAnalysis, rateLimitAnalysis, patternAnalysis, stealthAnalysis);
  }

  private static analyzePortResponses(portResults: Array<{ port: number; status: string; latency: number }>): {
    filteredPorts: number;
    openPorts: number;
    closedPorts: number;
    avgLatency: number;
    latencyVariance: number;
    suspiciousPatterns: string[];
  } {
    const filtered = portResults.filter(p => p.status === 'filtered').length;
    const open = portResults.filter(p => p.status === 'open').length;
    const closed = portResults.filter(p => p.status === 'closed').length;
    
    const latencies = portResults.map(p => p.latency);
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const variance = latencies.reduce((acc, lat) => acc + Math.pow(lat - avgLatency, 2), 0) / latencies.length;
    
    const suspiciousPatterns: string[] = [];
    
    // Check for suspicious filtering patterns
    if (filtered > open + closed) {
      suspiciousPatterns.push('High number of filtered ports suggests firewall presence');
    }
    
    if (filtered > 0 && open === 0) {
      suspiciousPatterns.push('All responsive ports filtered - likely behind firewall');
    }
    
    // Check for consistent response times (indicating rate limiting)
    const consistentTiming = latencies.every(lat => Math.abs(lat - avgLatency) < 50);
    if (consistentTiming && latencies.length > 5) {
      suspiciousPatterns.push('Consistent response timing suggests rate limiting');
    }
    
    return {
      filteredPorts: filtered,
      openPorts: open,
      closedPorts: closed,
      avgLatency,
      latencyVariance: variance,
      suspiciousPatterns
    };
  }

  private static async performTimingAnalysis(
    target: string,
    samplePorts: Array<{ port: number; status: string; latency: number }>
  ): Promise<TimingAnalysis> {
    const timingSamples: number[] = [];
    
    // Perform multiple timing tests on a subset of ports
    for (const portInfo of samplePorts.slice(0, 3)) {
      for (let i = 0; i < 3; i++) {
        try {
          const startTime = Date.now();
          
          // Try different connection methods
          if ([80, 443, 8080, 8443].includes(portInfo.port)) {
            const protocol = [443, 8443].includes(portInfo.port) ? 'https' : 'http';
            await fetch(`${protocol}://${target}:${portInfo.port}`, {
              method: 'HEAD',
              signal: AbortSignal.timeout(5000)
            }).catch(() => {});
          } else {
            // Use WebSocket for other ports
            const ws = new WebSocket(`ws://${target}:${portInfo.port}`);
            await new Promise((resolve) => {
              const timeout = setTimeout(resolve, 2000);
              ws.onopen = () => { clearTimeout(timeout); ws.close(); resolve(null); };
              ws.onerror = () => { clearTimeout(timeout); resolve(null); };
            });
          }
          
          const responseTime = Date.now() - startTime;
          timingSamples.push(responseTime);
          
          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          // Ignore errors, we're just measuring timing
        }
      }
    }
    
    if (timingSamples.length === 0) {
      return {
        min: 0,
        max: 0,
        avg: 0,
        stddev: 0,
        samples: [],
        outliers: [],
        pattern: 'random'
      };
    }
    
    const min = Math.min(...timingSamples);
    const max = Math.max(...timingSamples);
    const avg = timingSamples.reduce((a, b) => a + b, 0) / timingSamples.length;
    const variance = timingSamples.reduce((acc, time) => acc + Math.pow(time - avg, 2), 0) / timingSamples.length;
    const stddev = Math.sqrt(variance);
    
    // Detect outliers (values more than 2 standard deviations from mean)
    const outliers = timingSamples.filter(time => Math.abs(time - avg) > 2 * stddev);
    
    // Determine pattern
    let pattern: 'consistent' | 'variable' | 'rate-limited' | 'random' = 'random';
    if (stddev < avg * 0.1) {
      pattern = 'consistent';
    } else if (stddev < avg * 0.3) {
      pattern = 'variable';
    } else if (timingSamples.some(time => time > 1000)) {
      pattern = 'rate-limited';
    }
    
    return {
      min,
      max,
      avg,
      stddev,
      samples: timingSamples,
      outliers,
      pattern
    };
  }

  private static async detectRateLimit(target: string): Promise<{
    detected: boolean;
    threshold?: number;
    evidence: string[];
  }> {
    const evidence: string[] = [];
    let detected = false;
    let threshold: number | undefined;
    
    try {
      // Perform rapid requests to detect rate limiting
      const rapidRequests = [];
      const startTime = Date.now();
      
      for (let i = 0; i < 5; i++) {
        rapidRequests.push(
          fetch(`http://${target}:80`, {
            method: 'HEAD',
            signal: AbortSignal.timeout(3000)
          }).catch(() => ({ ok: false, status: 0 }))
        );
      }
      
      const responses = await Promise.all(rapidRequests);
      const totalTime = Date.now() - startTime;
      
      // Check for rate limiting indicators
      const rateLimitHeaders = ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'Retry-After'];
      const hasRateLimitHeaders = responses.some((response: any) => 
        rateLimitHeaders.some(header => response.headers?.has(header))
      );
      
      if (hasRateLimitHeaders) {
        detected = true;
        evidence.push('Rate limiting headers detected');
      }
      
      // Check for 429 status codes
      const rateLimitResponses = responses.filter((response: any) => response.status === 429);
      if (rateLimitResponses.length > 0) {
        detected = true;
        evidence.push(`${rateLimitResponses.length} rate limit responses (429) received`);
      }
      
      // Check for suspiciously slow responses
      if (totalTime > 10000) {
        detected = true;
        evidence.push('Suspiciously slow response times suggest rate limiting');
        threshold = totalTime / 5;
      }
      
    } catch (error) {
      evidence.push('Rate limit detection failed due to connection issues');
    }
    
    return { detected, threshold, evidence };
  }

  private static analyzeResponsePatterns(portResults: Array<{ port: number; status: string; latency: number }>): {
    patterns: string[];
    firewallSignatures: string[];
    confidence: number;
  } {
    const patterns: string[] = [];
    const firewallSignatures: string[] = [];
    let confidence = 0;
    
    const filtered = portResults.filter(p => p.status === 'filtered');
    const open = portResults.filter(p => p.status === 'open');
    const closed = portResults.filter(p => p.status === 'closed');
    
    // Analyze port filtering patterns
    if (filtered.length > 0) {
      confidence += 30;
      patterns.push(`${filtered.length} ports filtered`);
      
      // Check for common firewall port patterns
      const commonFilteredPorts = [135, 139, 445, 1433, 3389];
      const filteredCommonPorts = filtered.filter(p => commonFilteredPorts.includes(p.port));
      
      if (filteredCommonPorts.length > 0) {
        confidence += 20;
        firewallSignatures.push('Common administrative ports filtered');
      }
    }
    
    // Check for sequential port filtering
    const sortedPorts = portResults.sort((a, b) => a.port - b.port);
    let consecutiveFiltered = 0;
    let maxConsecutive = 0;
    
    for (let i = 0; i < sortedPorts.length - 1; i++) {
      if (sortedPorts[i].status === 'filtered' && 
          sortedPorts[i + 1].status === 'filtered' &&
          sortedPorts[i + 1].port === sortedPorts[i].port + 1) {
        consecutiveFiltered++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveFiltered);
      } else {
        consecutiveFiltered = 0;
      }
    }
    
    if (maxConsecutive > 5) {
      confidence += 25;
      firewallSignatures.push(`${maxConsecutive} consecutive ports filtered`);
    }
    
    // Analyze response time patterns
    const latencies = portResults.map(p => p.latency);
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const variance = latencies.reduce((acc, lat) => acc + Math.pow(lat - avgLatency, 2), 0) / latencies.length;
    
    if (variance < 100 && avgLatency > 100) {
      confidence += 15;
      patterns.push('Consistent response timing suggests traffic shaping');
    }
    
    // Check for firewall-specific behaviors
    if (open.length > 0 && filtered.length > open.length * 2) {
      confidence += 20;
      firewallSignatures.push('High filter-to-open ratio indicates selective filtering');
    }
    
    return { patterns, firewallSignatures, confidence: Math.min(confidence, 100) };
  }

  private static async performStealthDetection(target: string): Promise<{
    stealthTechniques: string[];
    bypassSuggestions: string[];
    detected: boolean;
  }> {
    const stealthTechniques: string[] = [];
    const bypassSuggestions: string[] = [];
    let detected = false;
    
    try {
      // Test different protocols and methods
      const testResults = await Promise.allSettled([
        // Test HTTP vs HTTPS behavior
        this.testProtocolDifferences(target),
        // Test different user agents
        this.testUserAgentFiltering(target),
        // Test fragment handling
        this.testFragmentHandling(target)
      ]);
      
      testResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.detected) {
          detected = true;
          stealthTechniques.push(...result.value.techniques);
          bypassSuggestions.push(...result.value.bypasses);
        }
      });
      
    } catch (error) {
      stealthTechniques.push('Stealth detection failed due to connection issues');
    }
    
    return { stealthTechniques, bypassSuggestions, detected };
  }

  private static async testProtocolDifferences(target: string): Promise<{
    detected: boolean;
    techniques: string[];
    bypasses: string[];
  }> {
    try {
      const httpTest = fetch(`http://${target}:80`, { 
        method: 'HEAD', 
        signal: AbortSignal.timeout(5000) 
      }).catch(() => null);
      
      const httpsTest = fetch(`https://${target}:443`, { 
        method: 'HEAD', 
        signal: AbortSignal.timeout(5000) 
      }).catch(() => null);
      
      const [httpResult, httpsResult] = await Promise.all([httpTest, httpsTest]);
      
      if (httpResult && !httpsResult) {
        return {
          detected: true,
          techniques: ['HTTPS traffic blocked while HTTP allowed'],
          bypasses: ['Try HTTP tunneling', 'Use different HTTPS ports']
        };
      }
      
      if (!httpResult && httpsResult) {
        return {
          detected: true,
          techniques: ['HTTP traffic blocked while HTTPS allowed'],
          bypasses: ['Use HTTPS for all connections', 'Try HTTP over TLS']
        };
      }
      
    } catch (error) {
      // Ignore errors
    }
    
    return { detected: false, techniques: [], bypasses: [] };
  }

  private static async testUserAgentFiltering(target: string): Promise<{
    detected: boolean;
    techniques: string[];
    bypasses: string[];
  }> {
    try {
      const normalUA = fetch(`http://${target}:80`, {
        method: 'HEAD',
        headers: { 'User-Agent': 'NetProbe/3.0' },
        signal: AbortSignal.timeout(5000)
      }).catch(() => null);
      
      const browserUA = fetch(`http://${target}:80`, {
        method: 'HEAD',
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(5000)
      }).catch(() => null);
      
      const [normalResult, browserResult] = await Promise.all([normalUA, browserUA]);
      
      if (!normalResult && browserResult) {
        return {
          detected: true,
          techniques: ['User-Agent filtering detected'],
          bypasses: ['Use common browser User-Agent strings', 'Rotate User-Agent headers']
        };
      }
      
    } catch (error) {
      // Ignore errors
    }
    
    return { detected: false, techniques: [], bypasses: [] };
  }

  private static async testFragmentHandling(target: string): Promise<{
    detected: boolean;
    techniques: string[];
    bypasses: string[];
  }> {
    // Fragment handling testing is very limited in browsers
    // This is a placeholder for more advanced techniques
    return { detected: false, techniques: [], bypasses: [] };
  }

  private static compileAnalysis(
    portAnalysis: any,
    timingAnalysis: TimingAnalysis,
    rateLimitAnalysis: any,
    patternAnalysis: any,
    stealthAnalysis: any
  ): FirewallAnalysis {
    const indicators: string[] = [];
    let confidence = 0;
    let detected = false;
    let type: FirewallAnalysis['type'] = 'unknown';
    
    // Compile indicators from all analyses
    indicators.push(...portAnalysis.suspiciousPatterns);
    indicators.push(...rateLimitAnalysis.evidence);
    indicators.push(...patternAnalysis.patterns);
    indicators.push(...patternAnalysis.firewallSignatures);
    indicators.push(...stealthAnalysis.stealthTechniques);
    
    // Calculate overall confidence
    confidence = Math.max(
      patternAnalysis.confidence,
      rateLimitAnalysis.detected ? 70 : 0,
      stealthAnalysis.detected ? 60 : 0,
      portAnalysis.filteredPorts > 5 ? 50 : 0
    );
    
    detected = confidence > 30;
    
    // Determine firewall type
    if (rateLimitAnalysis.detected) {
      type = 'proxy';
    } else if (portAnalysis.filteredPorts > portAnalysis.openPorts) {
      type = 'stateful';
    } else if (timingAnalysis.pattern === 'consistent') {
      type = 'packet-filter';
    }
    
    // Generate recommendations
    const recommendations: string[] = [];
    if (detected) {
      recommendations.push('Consider using stealth scanning techniques');
      recommendations.push('Try scanning from different source addresses');
      recommendations.push('Use timing delays between scan attempts');
      recommendations.push('Consider fragmenting scan packets');
    }
    
    if (rateLimitAnalysis.detected) {
      recommendations.push('Implement rate limiting in scan configuration');
      recommendations.push('Use longer delays between requests');
    }
    
    return {
      detected,
      type,
      confidence,
      indicators,
      avgResponseTime: timingAnalysis.avg,
      responseVariance: timingAnalysis.stddev,
      rateLimitDetected: rateLimitAnalysis.detected,
      droppedPackets: portAnalysis.filteredPorts,
      resetResponses: 0, // Limited detection in browser
      icmpUnreachable: 0, // Limited detection in browser
      fingerprint: this.generateFingerprint(portAnalysis, timingAnalysis, patternAnalysis),
      bypassTechniques: stealthAnalysis.bypassSuggestions,
      recommendations
    };
  }

  private static generateFingerprint(portAnalysis: any, timingAnalysis: TimingAnalysis, patternAnalysis: any): string {
    const components = [
      `F:${portAnalysis.filteredPorts}`,
      `O:${portAnalysis.openPorts}`,
      `T:${Math.round(timingAnalysis.avg)}`,
      `V:${Math.round(timingAnalysis.stddev)}`,
      `P:${timingAnalysis.pattern}`,
      `C:${patternAnalysis.confidence}`
    ];
    
    return components.join('|');
  }
}