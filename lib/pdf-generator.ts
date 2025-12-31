// Using pdf-lib instead of pdfkit for better Next.js compatibility
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export interface PDFOptions {
  size?: "small" | "medium" | "large";
  contentType?: "text" | "table" | "mixed";
  title?: string;
}

const loremIpsum = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
  "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.",
  "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia.",
  "Deserunt mollit anim id est laborum.",
  "Sed ut perspiciatis unde omnis iste natus error sit voluptatem.",
  "Accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae.",
  "Ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt.",
  "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.",
];

function getSizeConfig(size: "small" | "medium" | "large") {
  switch (size) {
    case "small":
      return { pages: 1, paragraphs: 3, rows: 5 };
    case "medium":
      return { pages: 2, paragraphs: 6, rows: 10 };
    case "large":
      return { pages: 3, paragraphs: 10, rows: 15 };
    default:
      return { pages: 2, paragraphs: 6, rows: 10 };
  }
}

function generateRandomText(paragraphs: number): string[] {
  const text: string[] = [];
  for (let i = 0; i < paragraphs; i++) {
    const sentences = Math.floor(Math.random() * 3) + 2;
    const paragraph = Array.from({ length: sentences }, () =>
      loremIpsum[Math.floor(Math.random() * loremIpsum.length)]
    ).join(" ");
    text.push(paragraph);
  }
  return text;
}

function generateTableData(rows: number): Array<{ id: number; name: string; value: number; status: string }> {
  const statuses = ["Active", "Pending", "Completed", "Cancelled"];
  const names = ["Item", "Product", "Service", "Task", "Order", "Request"];
  
  return Array.from({ length: rows }, (_, i) => ({
    id: i + 1,
    name: `${names[Math.floor(Math.random() * names.length)]} ${i + 1}`,
    value: Math.floor(Math.random() * 10000) + 100,
    status: statuses[Math.floor(Math.random() * statuses.length)],
  }));
}

export async function generatePDF(options: PDFOptions = {}): Promise<Buffer> {
  const { size = "medium", contentType = "mixed", title } = options;
  const config = getSizeConfig(size);

  const pdfDoc = await PDFDocument.create();
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595; // A4 width in points
  const pageHeight = 842; // A4 height in points
  const margin = 50;
  const contentWidth = pageWidth - (margin * 2);

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let yPosition = pageHeight - margin;

  // Add title
  const titleText = title || "Generated Test Document";
  const titleFontSize = 20;
  currentPage.drawText(titleText, {
    x: margin,
    y: yPosition,
    size: titleFontSize,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
  });
  yPosition -= titleFontSize + 20;

  // Add content based on type
  if (contentType === "text" || contentType === "mixed") {
    const paragraphs = generateRandomText(config.paragraphs);
    const fontSize = 12;
    const lineHeight = fontSize * 1.5;

    for (const para of paragraphs) {
      // Check if we need a new page
      if (yPosition < margin + 50) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        yPosition = pageHeight - margin;
      }

      // Simple text wrapping (basic implementation)
      const words = para.split(" ");
      let line = "";
      for (const word of words) {
        const testLine = line + (line ? " " : "") + word;
        const textWidth = helveticaFont.widthOfTextAtSize(testLine, fontSize);
        
        if (textWidth > contentWidth && line) {
          currentPage.drawText(line, {
            x: margin,
            y: yPosition,
            size: fontSize,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
          yPosition -= lineHeight;
          line = word;
          
          // Check for new page
          if (yPosition < margin + 50) {
            currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
            yPosition = pageHeight - margin;
          }
        } else {
          line = testLine;
        }
      }
      
      if (line) {
        currentPage.drawText(line, {
          x: margin,
          y: yPosition,
          size: fontSize,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
      }
      
      yPosition -= lineHeight; // Space between paragraphs
    }
  }

  if (contentType === "table" || contentType === "mixed") {
    // Check if we need a new page
    if (yPosition < margin + 200) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      yPosition = pageHeight - margin;
    }

    const tableData = generateTableData(config.rows);
    const tableTop = yPosition;
    const itemHeight = 20;
    const startX = margin;
    const colWidths = { id: 50, name: 200, value: 100, status: 100 };

    // Table header
    const headerFontSize = 10;
    currentPage.drawText("ID", {
      x: startX,
      y: tableTop,
      size: headerFontSize,
      font: helveticaBoldFont,
      color: rgb(0, 0, 0),
    });
    currentPage.drawText("Name", {
      x: startX + colWidths.id,
      y: tableTop,
      size: headerFontSize,
      font: helveticaBoldFont,
      color: rgb(0, 0, 0),
    });
    currentPage.drawText("Value", {
      x: startX + colWidths.id + colWidths.name,
      y: tableTop,
      size: headerFontSize,
      font: helveticaBoldFont,
      color: rgb(0, 0, 0),
    });
    currentPage.drawText("Status", {
      x: startX + colWidths.id + colWidths.name + colWidths.value,
      y: tableTop,
      size: headerFontSize,
      font: helveticaBoldFont,
      color: rgb(0, 0, 0),
    });

    // Draw header underline
    currentPage.drawLine({
      start: { x: startX, y: tableTop - 15 },
      end: {
        x: startX + colWidths.id + colWidths.name + colWidths.value + colWidths.status,
        y: tableTop - 15,
      },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Table rows
    const rowFontSize = 9;
    tableData.forEach((row, i) => {
      const y = tableTop - 20 - (i * itemHeight);
      
      // Check if we need a new page
      if (y < margin + 50) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        const newY = pageHeight - margin - 20;
        // Redraw header on new page
        currentPage.drawText("ID", {
          x: startX,
          y: newY,
          size: headerFontSize,
          font: helveticaBoldFont,
          color: rgb(0, 0, 0),
        });
        currentPage.drawText("Name", {
          x: startX + colWidths.id,
          y: newY,
          size: headerFontSize,
          font: helveticaBoldFont,
          color: rgb(0, 0, 0),
        });
        currentPage.drawText("Value", {
          x: startX + colWidths.id + colWidths.name,
          y: newY,
          size: headerFontSize,
          font: helveticaBoldFont,
          color: rgb(0, 0, 0),
        });
        currentPage.drawText("Status", {
          x: startX + colWidths.id + colWidths.name + colWidths.value,
          y: newY,
          size: headerFontSize,
          font: helveticaBoldFont,
          color: rgb(0, 0, 0),
        });
        return; // Skip this row, it will be on next page
      }

      currentPage.drawText(String(row.id), {
        x: startX,
        y: y,
        size: rowFontSize,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
      currentPage.drawText(row.name, {
        x: startX + colWidths.id,
        y: y,
        size: rowFontSize,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
      currentPage.drawText(`$${row.value}`, {
        x: startX + colWidths.id + colWidths.name,
        y: y,
        size: rowFontSize,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
      currentPage.drawText(row.status, {
        x: startX + colWidths.id + colWidths.name + colWidths.value,
        y: y,
        size: rowFontSize,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
    });

    yPosition = tableTop - 20 - (tableData.length * itemHeight) - 20;
  }

  // Add footer to last page
  const pages = pdfDoc.getPages();
  const lastPage = pages[pages.length - 1];
  lastPage.drawText(`Generated at ${new Date().toLocaleString()}`, {
    x: margin,
    y: 30,
    size: 8,
    font: helveticaFont,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
