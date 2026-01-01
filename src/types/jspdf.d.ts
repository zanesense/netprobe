declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';
  
  function autoTable(doc: jsPDF, options: {
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
  }): void;
  
  export default autoTable;
}

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: {
      finalY: number;
    };
  }
}