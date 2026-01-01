import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import { ScanResult, PortResult, ServiceInfo, Host, Finding } from '@/types/scanner';

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

  // Test function to verify PDF generation works
  static async testPDFGeneration(): Promise<void> {
    try {
      const doc = new jsPDF();
      
      doc.text('PDF Generation Test', 20, 20);
      
      // Test autoTable
      autoTable(doc, {
        startY: 30,
        head: [['Test', 'Column']],
        body: [['Test', 'Data']],
        theme: 'grid'
      });
      
      doc.save('test-pdf.pdf');
      console.log('PDF test generation successful');
    } catch (error) {
      console.error('PDF test generation failed:', error);
      throw error;
    }
  }

  static async generatePDF(data: ReportData): Promise<void> {
    try {
      // Validate required data
      if (!data || !data.scanResult || !data.metadata) {
        throw new Error('Invalid report data structure');
      }

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
        ['Target', data.scanResult.target || 'Unknown'],
        ['Scan Type', data.scanResult.scanType || 'Unknown'],
        ['Start Time', data.scanResult.startTime ? this.formatDate(data.scanResult.startTime) : 'Unknown'],
        ['Duration', this.formatDuration(data.metadata.scanDuration || 0)],
        ['Total Ports Scanned', (data.metadata.totalPorts || 0).toString()],
        ['Open Ports', (data.metadata.openPorts || 0).toString()],
        ['Filtered Ports', (data.metadata.filteredPorts || 0).toString()],
        ['Services Detected', (data.services?.length || 0).toString()],
        ['Hosts Discovered', (data.hosts?.length || 0).toString()],
        ['Security Findings', (data.findings?.length || 0).toString()]
      ];

      autoTable(doc, {
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
      if (data.scanResult.ports && data.scanResult.ports.length > 0) {
        doc.setFontSize(16);
        doc.text('Open Ports', 20, yPosition);
        yPosition += 10;

        const portData = data.scanResult.ports
          .filter(port => port.status === 'open')
          .map(port => [
            (port.port || 0).toString(),
            (port.protocol || 'unknown').toUpperCase(),
            port.service || 'Unknown',
            port.version || 'N/A',
            `${port.latency || 0}ms`
          ]);

        if (portData.length > 0) {
          autoTable(doc, {
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
      if (data.services && data.services.length > 0) {
        doc.setFontSize(16);
        doc.text('Detected Services', 20, yPosition);
        yPosition += 10;

        const serviceData = data.services.map(service => [
          (service.port || 0).toString(),
          service.name || 'Unknown',
          service.product || 'N/A',
          service.version || 'N/A',
          service.secure ? 'Yes' : 'No',
          `${service.confidence || 0}%`
        ]);

        autoTable(doc, {
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
      if (data.hosts && data.hosts.length > 0) {
        doc.setFontSize(16);
        doc.text('Host Information', 20, yPosition);
        yPosition += 10;

        const hostData = data.hosts.map(host => [
          host.ip || 'Unknown',
          host.hostname || 'N/A',
          (host.status || 'unknown').toUpperCase(),
          host.osInfo?.name || 'Unknown',
          host.osInfo?.deviceType || 'Unknown',
          (host.ports?.filter(p => p.status === 'open').length || 0).toString()
        ]);

        autoTable(doc, {
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
      if (data.findings && data.findings.length > 0) {
        // Check if we need a new page
        if (yPosition > pageHeight - 150) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(16);
        doc.text('Security Findings', 20, yPosition);
        yPosition += 10;

        const findingData = data.findings.map(finding => [
          finding.title || 'Unknown Finding',
          (finding.severity || 'info').toUpperCase(),
          finding.description || 'No description available',
          finding.remediation || 'N/A'
        ]);

        autoTable(doc, {
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
          `Generated by NetProbe v${data.metadata.version || '3.0.0'} - ${data.metadata.generatedBy || 'NetProbe'}`,
          pageWidth / 2,
          pageHeight - 5,
          { align: 'center' }
        );
        doc.text(
          `Created by zanesense - github.com/zanesense`,
          pageWidth / 2,
          pageHeight - 2,
          { align: 'center' }
        );
      }

      // Save the PDF with fallback mechanism
      const fileName = `netprobe-report-${(data.scanResult.target || 'unknown').replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.pdf`;
      
      try {
        doc.save(fileName);
      } catch (saveError) {
        console.warn('Direct save failed, trying alternative method:', saveError);
        
        // Fallback: Generate blob and create download link
        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error(`Failed to generate PDF report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
    csvData.push(['CREDITS']);
    csvData.push(['Tool', 'NetProbe - Network Security Assessment Tool']);
    csvData.push(['Author', 'zanesense']);
    csvData.push(['GitHub', 'https://github.com/zanesense']);
    csvData.push(['Repository', 'https://github.com/zanesense/netprobe']);
    csvData.push(['License', 'MIT']);
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
      },
      credits: {
        tool: 'NetProbe - Network Security Assessment Tool',
        version: data.metadata.version || '3.0.0',
        author: 'zanesense',
        github: 'https://github.com/zanesense',
        repository: 'https://github.com/zanesense/netprobe',
        license: 'MIT'
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
    // Validate input data
    if (!scanResult) {
      throw new Error('Scan result is required for report generation');
    }

    if (!scanResult.target) {
      throw new Error('Scan target is required for report generation');
    }

    if (!scanResult.startTime || !scanResult.endTime) {
      throw new Error('Scan start and end times are required for report generation');
    }

    const reportData: ReportData = {
      scanResult,
      hosts: hosts || [],
      services: services || [],
      findings: findings || [],
      metadata: {
        generatedAt: new Date(),
        generatedBy: 'NetProbe Security Scanner',
        version: '3.0.0',
        scanDuration: scanResult.duration || 0,
        totalPorts: scanResult.ports?.length || 0,
        openPorts: scanResult.ports?.filter(p => p.status === 'open').length || 0,
        filteredPorts: scanResult.ports?.filter(p => p.status === 'filtered').length || 0,
        closedPorts: scanResult.ports?.filter(p => p.status === 'closed').length || 0
      }
    };

    try {
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
    } catch (error) {
      console.error(`Error generating ${format} report:`, error);
      throw new Error(`Failed to generate ${format.toUpperCase()} report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}