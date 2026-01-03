// Import jsPDF and autoTable with types
import { jsPDF, jsPDFOptions } from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';

// Extend jsPDF type with autoTable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: {
      finalY: number;
    };
    autoTable: (options: UserOptions) => jsPDF;
  }
}

// Apply autoTable to jsPDF prototype
(jsPDF.prototype as any).autoTable = autoTable;

// Define jsPDFWithAutoTable interface
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
  autoTable: (options: UserOptions) => jsPDF;
}

// Helper function to format date
const formatDateString = (dateString: string | { $date: string } | Date): string => {
  try {
    const date = typeof dateString === 'string' 
      ? new Date(dateString) 
      : dateString instanceof Date 
        ? dateString 
        : new Date(dateString.$date);
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
};

export const exportChallengeToPdf = async (challengeData: any): Promise<void> => {
  try {
    // Create a new PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    }) as unknown as jsPDFWithAutoTable;

    // Set document properties
    const title = challengeData.name || 'Challenge Report';
    const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Add title and header
    pdf.setFontSize(20);
    pdf.setTextColor(40, 40, 40);
    pdf.text(title, 15, 20);
    
    // Add challenge details
    let yPos = 30;
    const lineHeight = 7;
    const leftMargin = 15;
    const rightMargin = 15;
    const pageWidth = 210; // A4 width in mm
    const maxWidth = pageWidth - leftMargin * 2;
    
    // Challenge Info Section
    pdf.setFontSize(14);
    pdf.setTextColor(60, 60, 60);
    pdf.text('Challenge Information', leftMargin, yPos);
    yPos += 10;
    
    pdf.setFontSize(10);
    pdf.setTextColor(80, 80, 80);
    
    // Basic Info
    const basicInfo = [
      `ID: ${challengeData._id?.$oid || challengeData._id || 'N/A'}`,
      `Status: ${challengeData.status ? challengeData.status.charAt(0).toUpperCase() + challengeData.status.slice(1) : 'N/A'}`,
      `Created: ${formatDateString(challengeData.createdAt || '')}`,
      `Last Updated: ${formatDateString(challengeData.updatedAt || '')}`,
      `Start Date: ${formatDateString(challengeData.startDate || '')}`,
      `End Date: ${challengeData.endDate ? formatDateString(challengeData.endDate) : 'Ongoing'}`,
      `Is Deleted: ${challengeData.isDeleted ? 'Yes' : 'No'}`
    ];
    
    basicInfo.forEach((info, index) => {
      pdf.text(info, leftMargin, yPos + (index * lineHeight));
    });
    
    yPos += (basicInfo.length * lineHeight) + 10;

    // Challenge details section is already handled above

    // Add sections
    if (challengeData.sections && challengeData.sections.length > 0) {
      pdf.setFontSize(14);
      pdf.setTextColor(60, 60, 60);
      pdf.text('Sections', leftMargin, yPos);
      yPos += 10;
      
      challengeData.sections.forEach((section: any, sectionIndex: number) => {
        // Check if we need a new page
        if (yPos > 270) {
          pdf.addPage();
          yPos = 20;
        }
        
        // Section header
        pdf.setFontSize(12);
        pdf.setTextColor(40, 40, 40);
        pdf.text(`Section ${sectionIndex + 1}: ${section.name || 'Unnamed Section'}`, leftMargin, yPos);
        yPos += lineHeight;
        
        // Section details
        pdf.setFontSize(10);
        pdf.setTextColor(80, 80, 80);
        pdf.text(`Order: ${section.order || 'N/A'}`, leftMargin, yPos);
        pdf.text(`Progress: ${section.progress || 0}%`, leftMargin + 30, yPos);
        yPos += lineHeight;
        
        // Subjects table
        if (section.subjects && section.subjects.length > 0) {
          pdf.setFontSize(11);
          pdf.setTextColor(60, 60, 60);
          pdf.text('Subjects:', leftMargin, yPos);
          yPos += 8;
          
          const headers = [['Name', 'Status', 'Progress', 'Start Date', 'End Date']];
          const data = section.subjects.map((subject: any) => [
            subject.name || 'N/A',
            subject.status ? subject.status.split('_').map((word: string) => 
              word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'N/A',
            `${subject.progress || 0}%`,
            subject.startDate ? formatDateString(subject.startDate) : 'N/A',
            subject.endDate ? formatDateString(subject.endDate) : 'N/A'
          ]);
          
          // Add autoTable
          (pdf as any).autoTable({
            head: headers,
            body: data,
            startY: yPos,
            margin: { left: leftMargin, right: rightMargin },
            headStyles: {
              fillColor: [59, 130, 246], // Blue-500
              textColor: 255,
              fontStyle: 'bold',
              fontSize: 9
            },
            styles: {
              fontSize: 8,
              cellPadding: 2,
              overflow: 'linebreak',
              cellWidth: 'wrap',
              lineColor: [209, 213, 219], // Gray-300
              lineWidth: 0.5
            },
            columnStyles: {
              0: { cellWidth: 40 }, // Name
              1: { cellWidth: 30 }, // Status
              2: { cellWidth: 20 }, // Progress
              3: { cellWidth: 55 }, // Start Date
              4: { cellWidth: 55 }  // End Date
            },
            didDrawPage: (data: any) => {
              yPos = data.cursor.y + 5;
            },
            theme: 'grid' as const
          });
          
          // Add subject description if exists
          section.subjects.forEach((subject: any) => {
            if (subject.description) {
              if (yPos > 270) {
                pdf.addPage();
                yPos = 20;
              }
              
              pdf.setFontSize(9);
              pdf.setTextColor(60, 60, 60);
              pdf.text('Description:', leftMargin, yPos);
              yPos += 5;
              
              // Split long descriptions into multiple lines
              const descriptionLines = pdf.splitTextToSize(
                subject.description || 'No description',
                maxWidth - 10
              );
              
              pdf.setFontSize(8);
              pdf.setTextColor(100, 100, 100);
              pdf.text(descriptionLines, leftMargin + 5, yPos);
              yPos += (descriptionLines.length * 5) + 10;
            }
          });
        } else {
          pdf.setFontSize(10);
          pdf.setTextColor(100, 100, 100);
          pdf.text('No subjects in this section.', leftMargin + 5, yPos);
          yPos += lineHeight;
        }
        
        yPos += 10; // Space between sections
      });
    } else {
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text('No sections found in this challenge.', leftMargin, yPos);
      yPos += lineHeight;
    }

    // Removed duplicate section processing code

    // Add page numbers
    const pageCount = (pdf as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(10);
      pdf.setTextColor(150, 150, 150);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // @ts-ignore - jsPDF text options type is incomplete
      pdf.text(`Page ${i} of ${pageCount}`, pageWidth - 15, pageHeight - 10, { align: 'right' });
    }

    // Save the PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
};
