import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';
import { ScanResult, PortResult, ServiceInfo, Host, Finding } from '@/types/scanner';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface ReportData {
  scanResult: ScanResult;
  hosts: Host[];
  services: ServiceInfo[];
  findings: Finding[];
  metadata: {
    generatedAt: Date;
    generatedBy: string;
    version: string;
    scanDuration: number;
    totalPorts: number;
    openPorts: number;
    filteredPorts: number;
    closedPorts: number;
  };
}

export class ReportGenerator {
  private static formatDate(date: Date): string {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  private static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  static async generatePDF(data: ReportData): Promise<void> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    // Header
    doc.setFontSize(24);
    doc.setTextColor(0, 255, 136); // NetProbe green
    doc.text('NetProbe Security Assessment Report', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 15;
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${this.formatDate(data.metadata.generatedAt)}`, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 20;

    // Executive Summary
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Executive Summary', 20, yPosition);
    yPosition += 10;

    const summaryData = [
      ['Target', data.scanResult.target],
      ['Scan Type', data.scanResult.scanType],
      ['Start Time', this.formatDate(data.scanResult.startTime)],
      ['Duration', this.formatDuration(data.metadata.scanDuration)],
      ['Total Ports Scanned', data.metadata.totalPorts.toString()],
      ['Open Ports', data.metadata.openPorts.toString()],
      ['Filtered Ports', data.metadata.filteredPorts.toString()],
      ['Services Detected', data.services.length.toString()],
      ['Hosts Discovered', data.hosts.length.toString()],
      ['Security Findings', data.findings.length.toString()]
    ];

    doc.autoTable({
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [0, 255, 136], textColor: [0, 0, 0] },
      styles: { fontSize: 10 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;

    // Check if we need a new page
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    // Open Ports Table
    if (data.scanResult.ports.length > 0) {
      doc.setFontSize(16);
      doc.text('Open Ports', 20, yPosition);
      yPosition += 10;

      const portData = data.scanResult.ports
        .filter(port => port.status === 'open')
        .map(port => [
          port.port.toString(),
          port.protocol.toUpperCase(),
          port.service || 'Unknown',
          port.version || 'N/A',
          `${port.latency}ms`
        ]);

      if (portData.length > 0) {
        doc.autoTable({
          startY: yPosition,
          head: [['Port', 'Protocol', 'Service', 'Version', 'Latency']],
          body: portData,
          theme: 'striped',
          headStyles: { fillColor: [0, 255, 136], textColor: [0, 0, 0] },
          styles: { fontSize: 9 }
        });

        yPosition = (doc as any).lastAutoTable.finalY + 20;
      }
    }

    // Check if we need a new page
    if (yPosition > pageHeight - 100) {
      doc.addPage();
      yPosition = 20;
    }

    // Services Table
    if (data.services.length > 0) {
      doc.setFontSize(16);
      doc.text('Detected Services', 20, yPosition);
      yPosition += 10;

      const serviceData = data.services.map(service => [
        service.port.toString(),
        service.name,
        service.product || 'N/A',
        service.version || 'N/A',
        service.secure ? 'Yes' : 'No',
        `${service.confidence}%`
      ]);

      doc.autoTable({
        startY: yPosition,
        head: [['Port', 'Service', 'Product', 'Version', 'Secure', 'Confidence']],
        body: serviceData,
        theme: 'striped',
        headStyles: { fillColor: [0, 255, 136], textColor: [0, 0, 0] },
        styles: { fontSize: 9 }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;
    }

    // Check if we need a new page
    if (yPosition > pageHeight - 100) {
      doc.addPage();
      yPosition = 20;
    }

    // Host Information
    if (data.hosts.length > 0) {
      doc.setFontSize(16);
      doc.text('Host Information', 20, yPosition);
      yPosition += 10;

      const hostData = data.hosts.map(host => [
        host.ip,
        host.hostname || 'N/A',
        host.status.toUpperCase(),
        host.osInfo?.name || 'Unknown',
        host.osInfo?.deviceType || 'Unknown',
        host.ports.filter(p => p.status === 'open').length.toString()
      ]);

      doc.autoTable({
        startY: yPosition,
        head: [['IP Address', 'Hostname', 'Status', 'OS', 'Device Type', 'Open Ports']],
        body: hostData,
        theme: 'striped',
        headStyles: { fillColor: [0, 255, 136], textColor: [0, 0, 0] },
        styles: { fontSize: 9 }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;
    }

    // Security Findings
    if (data.findings.length > 0) {
      // Check if we need a new page
      if (yPosition > pageHeight - 150) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.text('Security Findings', 20, yPosition);
      yPosition += 10;

      const findingData = data.findings.map(finding => [
        finding.title,
        finding.severity.toUpperCase(),
        finding.description,
        finding.remediation || 'N/A'
      ]);

      doc.autoTable({
        startY: yPosition,
        head: [['Finding', 'Severity', 'Description', 'Remediation']],
        body: findingData,
        theme: 'striped',
        headStyles: { fillColor: [0, 255, 136], textColor: [0, 0, 0] },
        styles: { fontSize: 8, cellWidth: 'wrap' },
        columnStyles: {
          2: { cellWidth: 60 },
          3: { cellWidth: 60 }
        }
      });
    }

    // Footer on last page
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `NetProbe Security Assessment Report - Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      doc.text(
        `Generated by NetProbe v${data.metadata.version} - ${data.metadata.generatedBy}`,
        pageWidth / 2,
        pageHeight - 5,
        { align: 'center' }
      );
    }

    // Save the PDF
    const fileName = `netprobe-report-${data.scanResult.target.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.pdf`;
    doc.save(fileName);
  }

  static generateCSV(data: ReportData): void {
    const csvData: any[] = [];

    // Add metadata
    csvData.push(['NetProbe Security Assessment Report']);
    csvData.push(['Generated', this.formatDate(data.metadata.generatedAt)]);
    csvData.push(['Target', data.scanResult.target]);
    csvData.push(['Scan Type', data.scanResult.scanType]);
    csvData.push(['Duration', this.formatDuration(data.metadata.scanDuration)]);
    csvData.push(['Total Ports', data.metadata.totalPorts]);
    csvData.push(['Open Ports', data.metadata.openPorts]);
    csvData.push(['Services Found', data.services.length]);
    csvData.push([]);

    // Add port scan results
    csvData.push(['PORT SCAN RESULTS']);
    csvData.push(['Port', 'Protocol', 'Status', 'Service', 'Version', 'Latency (ms)']);
    
    data.scanResult.ports.forEach(port => {
      csvData.push([
        port.port,
        port.protocol,
        port.status,
        port.service || 'Unknown',
        port.version || 'N/A',
        port.latency
      ]);
    });

    csvData.push([]);

    // Add service detection results
    if (data.services.length > 0) {
      csvData.push(['SERVICE DETECTION RESULTS']);
      csvData.push(['Port', 'Service', 'Product', 'Version', 'Secure', 'Confidence']);
      
      data.services.forEach(service => {
        csvData.push([
          service.port,
          service.name,
          service.product || 'N/A',
          service.version || 'N/A',
          service.secure ? 'Yes' : 'No',
          `${service.confidence}%`
        ]);
      });

      csvData.push([]);
    }

    // Add host information
    if (data.hosts.length > 0) {
      csvData.push(['HOST INFORMATION']);
      csvData.push(['IP Address', 'Hostname', 'Status', 'OS', 'Device Type', 'Open Ports']);
      
      data.hosts.forEach(host => {
        csvData.push([
          host.ip,
          host.hostname || 'N/A',
          host.status,
          host.osInfo?.name || 'Unknown',
          host.osInfo?.deviceType || 'Unknown',
          host.ports.filter(p => p.status === 'open').length
        ]);
      });

      csvData.push([]);
    }

    // Add security findings
    if (data.findings.length > 0) {
      csvData.push(['SECURITY FINDINGS']);
      csvData.push(['Title', 'Severity', 'Description', 'Remediation']);
      
      data.findings.forEach(finding => {
        csvData.push([
          finding.title,
          finding.severity,
          finding.description,
          finding.remediation || 'N/A'
        ]);
      });
    }

    // Convert to CSV and download
    const csv = Papa.unparse(csvData);
    const fileName = `netprobe-report-${data.scanResult.target.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.csv`;
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  static generateJSON(data: ReportData): void {
    const jsonReport = {
      metadata: {
        reportType: 'NetProbe Security Assessment',
        version: data.metadata.version,
        generatedAt: data.metadata.generatedAt.toISOString(),
        generatedBy: data.metadata.generatedBy,
        target: data.scanResult.target,
        scanType: data.scanResult.scanType,
        scanDuration: data.metadata.scanDuration,
        scanStartTime: data.scanResult.startTime.toISOString(),
        scanEndTime: data.scanResult.endTime.toISOString()
      },
      summary: {
        totalPorts: data.metadata.totalPorts,
        openPorts: data.metadata.openPorts,
        closedPorts: data.metadata.closedPorts,
        filteredPorts: data.metadata.filteredPorts,
        servicesDetected: data.services.length,
        hostsDiscovered: data.hosts.length,
        securityFindings: data.findings.length
      },
      scanResults: {
        ports: data.scanResult.ports.map(port => ({
          port: port.port,
          protocol: port.protocol,
          status: port.status,
          state: port.state,
          service: port.service,
          version: port.version,
          banner: port.banner,
          latency: port.latency,
          reason: port.reason
        })),
        services: data.services.map(service => ({
          port: service.port,
          name: service.name,
          product: service.product,
          version: service.version,
          extraInfo: service.extraInfo,
          osType: service.osType,
          deviceType: service.deviceType,
          cpe: service.cpe,
          banner: service.banner,
          secure: service.secure,
          confidence: service.confidence
        })),
        hosts: data.hosts.map(host => ({
          ip: host.ip,
          hostname: host.hostname,
          status: host.status,
          osInfo: host.osInfo ? {
            name: host.osInfo.name,
            family: host.osInfo.family,
            generation: host.osInfo.generation,
            accuracy: host.osInfo.accuracy,
            ttl: host.osInfo.ttl,
            windowSize: host.osInfo.windowSize,
            deviceType: host.osInfo.deviceType,
            vendor: host.osInfo.vendor,
            cpe: host.osInfo.cpe
          } : null,
          openPorts: host.ports.filter(p => p.status === 'open').length,
          totalPorts: host.ports.length
        })),
        findings: data.findings.map(finding => ({
          title: finding.title,
          description: finding.description,
          severity: finding.severity,
          remediation: finding.remediation
        }))
      },
      recommendations: this.generateRecommendations(data),
      compliance: {
        scanAuthorized: true,
        legalNoticeAccepted: true,
        auditTrail: true,
        dataRetention: '90 days',
        exportRestrictions: 'Internal use only'
      }
    };

    // Pretty print JSON
    const jsonString = JSON.stringify(jsonReport, null, 2);
    const fileName = `netprobe-report-${data.scanResult.target.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.json`;
    
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  private static generateRecommendations(data: ReportData): string[] {
    const recommendations: string[] = [];

    // Check for common security issues
    const openPorts = data.scanResult.ports.filter(p => p.status === 'open');
    const insecureServices = data.services.filter(s => !s.secure);

    if (openPorts.length > 10) {
      recommendations.push('Consider reducing the number of exposed services to minimize attack surface');
    }

    if (insecureServices.length > 0) {
      recommendations.push('Enable encryption (TLS/SSL) for unencrypted services where possible');
    }

    // Check for specific risky ports
    const riskyPorts = [21, 23, 25, 53, 135, 139, 445, 1433, 3306, 3389, 5432];
    const exposedRiskyPorts = openPorts.filter(p => riskyPorts.includes(p.port));
    
    if (exposedRiskyPorts.length > 0) {
      recommendations.push('Review exposed administrative and database services for necessity');
    }

    // Check for default services
    const defaultPorts = openPorts.filter(p => [80, 443, 22, 21].includes(p.port));
    if (defaultPorts.length > 0) {
      recommendations.push('Ensure default services are properly configured and secured');
    }

    // General recommendations
    recommendations.push('Regularly update and patch all identified services');
    recommendations.push('Implement network segmentation and access controls');
    recommendations.push('Monitor network traffic for suspicious activities');
    recommendations.push('Conduct regular security assessments');

    return recommendations;
  }

  static async generateReport(
    format: 'pdf' | 'csv' | 'json',
    scanResult: ScanResult,
    hosts: Host[],
    services: ServiceInfo[],
    findings: Finding[]
  ): Promise<void> {
    const reportData: ReportData = {
      scanResult,
      hosts,
      services,
      findings,
      metadata: {
        generatedAt: new Date(),
        generatedBy: 'NetProbe Security Scanner',
        version: '3.0.0',
        scanDuration: scanResult.duration,
        totalPorts: scanResult.ports.length,
        openPorts: scanResult.ports.filter(p => p.status === 'open').length,
        filteredPorts: scanResult.ports.filter(p => p.status === 'filtered').length,
        closedPorts: scanResult.ports.filter(p => p.status === 'closed').length
      }
    };

    switch (format) {
      case 'pdf':
        await this.generatePDF(reportData);
        break;
      case 'csv':
        this.generateCSV(reportData);
        break;
      case 'json':
        this.generateJSON(reportData);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }
}