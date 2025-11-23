import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

/**
 * Parse markdown text and convert to structured content
 */
function parseMarkdown(markdown: string) {
  const lines = markdown.split('\n');
  const content: Array<{ type: string; text: string; level?: number }> = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (!trimmed) {
      content.push({ type: 'paragraph', text: '' });
      continue;
    }
    
    // Headings
    if (trimmed.startsWith('####')) {
      content.push({ type: 'heading', text: trimmed.replace(/^####\s*/, ''), level: 4 });
    } else if (trimmed.startsWith('###')) {
      content.push({ type: 'heading', text: trimmed.replace(/^###\s*/, ''), level: 3 });
    } else if (trimmed.startsWith('##')) {
      content.push({ type: 'heading', text: trimmed.replace(/^##\s*/, ''), level: 2 });
    } else if (trimmed.startsWith('#')) {
      content.push({ type: 'heading', text: trimmed.replace(/^#\s*/, ''), level: 1 });
    }
    // List items
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      content.push({ type: 'list', text: trimmed.replace(/^[-*]\s*/, '') });
    }
    // Numbered list
    else if (/^\d+\.\s/.test(trimmed)) {
      content.push({ type: 'numbered', text: trimmed.replace(/^\d+\.\s*/, '') });
    }
    // Regular paragraph
    else {
      content.push({ type: 'paragraph', text: trimmed });
    }
  }
  
  return content;
}

/**
 * Remove markdown formatting from text
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1') // Bold
    .replace(/\*(.+?)\*/g, '$1') // Italic
    .replace(/`(.+?)`/g, '$1') // Code
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Links
    .trim();
}

/**
 * Export lesson plan as PDF
 */
export async function exportAsPDF(content: string, filename: string = 'lesson-plan.pdf') {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - (margin * 2);
  let yPosition = margin;
  
  const parsed = parseMarkdown(content);
  
  for (const item of parsed) {
    const text = stripMarkdown(item.text);
    
    if (!text && item.type === 'paragraph') {
      yPosition += 5;
      continue;
    }
    
    // Check if we need a new page
    if (yPosition > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
    
    switch (item.type) {
      case 'heading':
        if (item.level === 1) {
          doc.setFontSize(18);
          doc.setFont('helvetica', 'bold');
        } else if (item.level === 2) {
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
        } else if (item.level === 3) {
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
        } else {
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
        }
        
        const headingLines = doc.splitTextToSize(text, maxWidth);
        doc.text(headingLines, margin, yPosition);
        yPosition += headingLines.length * 8 + 5;
        break;
        
      case 'list':
      case 'numbered':
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        const bulletText = `• ${text}`;
        const listLines = doc.splitTextToSize(bulletText, maxWidth - 5);
        doc.text(listLines, margin + 5, yPosition);
        yPosition += listLines.length * 6 + 2;
        break;
        
      case 'paragraph':
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        const paraLines = doc.splitTextToSize(text, maxWidth);
        doc.text(paraLines, margin, yPosition);
        yPosition += paraLines.length * 6 + 3;
        break;
    }
  }
  
  doc.save(filename);
}

/**
 * Export lesson plan as DOCX
 */
export async function exportAsDOCX(content: string, filename: string = 'lesson-plan.docx') {
  const parsed = parseMarkdown(content);
  const children: Paragraph[] = [];
  
  for (const item of parsed) {
    const text = stripMarkdown(item.text);
    
    if (!text && item.type === 'paragraph') {
      children.push(new Paragraph({ text: '' }));
      continue;
    }
    
    switch (item.type) {
      case 'heading':
        let headingLevel = HeadingLevel.HEADING_1;
        if (item.level === 2) headingLevel = HeadingLevel.HEADING_2;
        else if (item.level === 3) headingLevel = HeadingLevel.HEADING_3;
        else if (item.level === 4) headingLevel = HeadingLevel.HEADING_4;
        
        children.push(
          new Paragraph({
            text: text,
            heading: headingLevel,
            spacing: { before: 240, after: 120 },
          })
        );
        break;
        
      case 'list':
      case 'numbered':
        children.push(
          new Paragraph({
            text: text,
            bullet: { level: 0 },
            spacing: { before: 60, after: 60 },
          })
        );
        break;
        
      case 'paragraph':
        // Check for bold/italic
        const runs: TextRun[] = [];
        const boldRegex = /\*\*(.+?)\*\*/g;
        const italicRegex = /\*(.+?)\*/g;
        
        let lastIndex = 0;
        let match;
        
        // Simple bold detection
        const boldMatches = [...text.matchAll(boldRegex)];
        if (boldMatches.length > 0) {
          for (const m of boldMatches) {
            if (m.index! > lastIndex) {
              runs.push(new TextRun(text.substring(lastIndex, m.index)));
            }
            runs.push(new TextRun({ text: m[1], bold: true }));
            lastIndex = m.index! + m[0].length;
          }
          if (lastIndex < text.length) {
            runs.push(new TextRun(text.substring(lastIndex)));
          }
        } else {
          runs.push(new TextRun(text));
        }
        
        children.push(
          new Paragraph({
            children: runs,
            spacing: { before: 60, after: 60 },
          })
        );
        break;
    }
  }
  
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: children,
      },
    ],
  });
  
  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
}

/**
 * Export lesson plan as TXT
 */
export function exportAsTXT(content: string, filename: string = 'lesson-plan.txt') {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, filename);
}

