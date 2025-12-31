declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: {
      startY?: number;
      head?: any[][];
      body?: any[][];
      theme?: 'striped' | 'grid' | 'plain';
      headStyles?: {
        fillColor?: number[];
        textColor?: number[];
        fontSize?: number;
      };
      styles?: {
        fontSize?: number;
        cellWidth?: string | number;
      };
      columnStyles?: {
        [key: number]: {
          cellWidth?: number;
        };
      };
    }) => jsPDF;
    lastAutoTable?: {
      finalY: number;
    };
  }
}