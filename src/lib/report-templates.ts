// Report templates and formatting utilities

export interface ReportTemplate {
  name: string;
  description: string;
  sections: ReportSection[];
  format: 'executive' | 'technical' | 'compliance';
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'summary' | 'table' | 'chart' | 'text' | 'recommendations';
  required: boolean;
  order: number;
}

export const REPORT_TEMPLATES: Record<string, ReportTemplate> = {
  executive: {
    name: 'Executive Summary',
    description: 'High-level overview for management and stakeholders',
    format: 'executive',
    sections: [
      { id: 'summary', title: 'Executive Summary', type: 'summary', required: true, order: 1 },
      { id: 'risk-overview', title: 'Risk Overview', type: 'chart', required: true, order: 2 },
      { id: 'key-findings', title: 'Key Findings', type: 'table', required: true, order: 3 },
      { id: 'recommendations', title: 'Recommendations', type: 'recommendations', required: true, order: 4 }
    ]
  },
  technical: {
    name: 'Technical Report',
    description: 'Detailed technical analysis for IT and security teams',
    format: 'technical',
    sections: [
      { id: 'summary', title: 'Scan Summary', type: 'summary', required: true, order: 1 },
      { id: 'methodology', title: 'Methodology', type: 'text', required: true, order: 2 },
      { id: 'host-discovery', title: 'Host Discovery', type: 'table', required: true, order: 3 },
      { id: 'port-analysis', title: 'Port Analysis', type: 'table', required: true, order: 4 },
      { id: 'service-detection', title: 'Service Detection', type: 'table', required: true, order: 5 },
      { id: 'os-fingerprinting', title: 'OS Fingerprinting', type: 'table', required: false, order: 6 },
      { id: 'vulnerabilities', title: 'Security Findings', type: 'table', required: true, order: 7 },
      { id: 'recommendations', title: 'Technical Recommendations', type: 'recommendations', required: true, order: 8 }
    ]
  },
  compliance: {
    name: 'Compliance Report',
    description: 'Compliance-focused report for audits and regulatory requirements',
    format: 'compliance',
    sections: [
      { id: 'compliance-summary', title: 'Compliance Summary', type: 'summary', required: true, order: 1 },
      { id: 'scope', title: 'Assessment Scope', type: 'text', required: true, order: 2 },
      { id: 'methodology', title: 'Testing Methodology', type: 'text', required: true, order: 3 },
      { id: 'findings', title: 'Compliance Findings', type: 'table', required: true, order: 4 },
      { id: 'evidence', title: 'Supporting Evidence', type: 'table', required: true, order: 5 },
      { id: 'remediation', title: 'Remediation Plan', type: 'recommendations', required: true, order: 6 },
      { id: 'attestation', title: 'Attestation', type: 'text', required: true, order: 7 }
    ]
  }
};

export const SEVERITY_COLORS = {
  critical: { bg: '#dc2626', text: '#ffffff' },
  high: { bg: '#ea580c', text: '#ffffff' },
  medium: { bg: '#d97706', text: '#ffffff' },
  low: { bg: '#65a30d', text: '#ffffff' },
  info: { bg: '#2563eb', text: '#ffffff' }
};

export const COMPLIANCE_FRAMEWORKS = {
  'ISO27001': 'ISO/IEC 27001:2013',
  'NIST': 'NIST Cybersecurity Framework',
  'PCI-DSS': 'Payment Card Industry Data Security Standard',
  'SOC2': 'SOC 2 Type II',
  'GDPR': 'General Data Protection Regulation',
  'HIPAA': 'Health Insurance Portability and Accountability Act'
};

export function generateReportMetadata(template: ReportTemplate, scanData: any) {
  return {
    title: `${template.name} - Network Security Assessment`,
    subtitle: `Target: ${scanData.target}`,
    generatedAt: new Date().toISOString(),
    template: template.name,
    version: '3.0.0',
    classification: 'CONFIDENTIAL',
    distribution: 'Internal Use Only'
  };
}

export function formatSeverityForDisplay(severity: string): string {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

export function getSeverityColor(severity: string): { bg: string; text: string } {
  return SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS] || SEVERITY_COLORS.info;
}

export function generateExecutiveSummary(scanData: any): string {
  const { hosts, services, findings, ports } = scanData;
  const openPorts = ports.filter((p: any) => p.status === 'open').length;
  const criticalFindings = findings.filter((f: any) => f.severity === 'critical').length;
  const highFindings = findings.filter((f: any) => f.severity === 'high').length;
  
  return `
This network security assessment was conducted on ${scanData.target} to identify potential security vulnerabilities and assess the overall security posture.

Key Findings:
• ${hosts.length} host(s) discovered and analyzed
• ${openPorts} open port(s) identified across all hosts
• ${services.length} service(s) detected and fingerprinted
• ${findings.length} security finding(s) identified

Risk Assessment:
• Critical Risk Issues: ${criticalFindings}
• High Risk Issues: ${highFindings}
• Medium Risk Issues: ${findings.filter((f: any) => f.severity === 'medium').length}
• Low Risk Issues: ${findings.filter((f: any) => f.severity === 'low').length}

The assessment reveals ${criticalFindings + highFindings > 0 ? 'significant security concerns that require immediate attention' : 'a generally secure configuration with minor improvements recommended'}.
  `.trim();
}

export function generateTechnicalMethodology(): string {
  return `
This network security assessment was conducted using NetProbe, a browser-based network reconnaissance tool. The assessment methodology included:

1. Host Discovery
   - HTTP/HTTPS connectivity testing
   - Service reachability verification
   - Response time analysis

2. Port Scanning
   - TCP Connect scanning for reliable port state detection
   - WebSocket connection probing for service identification
   - HTTP-based port detection for web services

3. Service Detection
   - Banner grabbing from HTTP services
   - Server header analysis
   - Service version identification

4. Operating System Fingerprinting
   - TTL-based OS detection
   - HTTP server signature analysis
   - Service-based OS inference

5. Security Analysis
   - Unencrypted service identification
   - Default configuration detection
   - Common vulnerability assessment

Note: This assessment operates within browser security constraints and provides results based on externally observable characteristics.
  `.trim();
}

export function generateComplianceAttestation(framework: string): string {
  const frameworkName = COMPLIANCE_FRAMEWORKS[framework as keyof typeof COMPLIANCE_FRAMEWORKS] || framework;
  
  return `
ATTESTATION

I hereby attest that this network security assessment was conducted in accordance with ${frameworkName} requirements and industry best practices.

The assessment was performed using authorized scanning techniques against systems owned by or with explicit permission from the target organization. All testing was conducted in a safe, non-intrusive manner designed to minimize impact on production systems.

The findings and recommendations contained in this report are based on the current configuration and security posture observed during the assessment period. Organizations should implement appropriate remediation measures and conduct regular reassessments to maintain security compliance.

This report is confidential and intended solely for the use of the target organization and its authorized representatives.

Generated by: NetProbe Security Scanner v3.0.0
Assessment Date: ${new Date().toLocaleDateString()}
Report Classification: CONFIDENTIAL
  `.trim();
}