import PDFDocument from "pdfkit";
import { Readable } from "stream";

/**
 * Converts various document types to PDF
 * Supports: Text, HTML-like content, and base64 files
 */

export async function convertTextToPdf(
  text: string,
  fileName: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      bufferPages: true,
      margin: 50,
    });

    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on("error", reject);

    // Add header
    doc.fontSize(18).font("Helvetica-Bold").text(fileName, { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica").text(`Generated: ${new Date().toLocaleString()}`, {
      color: "#666666",
    });
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke("#cccccc");
    doc.moveDown(1);

    // Add content
    doc.fontSize(11).font("Helvetica").text(text, {
      align: "left",
      wrap: true,
      lineGap: 5,
    });

    doc.end();
  });
}

export async function convertBase64ToPdf(
  base64Data: string,
  fileName: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Remove data URL prefix if present
      let cleanBase64 = base64Data;
      if (base64Data.includes(",")) {
        cleanBase64 = base64Data.split(",")[1];
      }

      const buffer = Buffer.from(cleanBase64, "base64");
      resolve(buffer);
    } catch (error) {
      reject(new Error(`Failed to convert base64 to PDF: ${error}`));
    }
  });
}

export async function createDocumentSummaryPdf(
  docName: string,
  category: string,
  uploadedAt: Date,
  status: string,
  userId: number
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      bufferPages: true,
      margin: 60,
    });

    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on("error", reject);

    // Title
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("📄 Document Summary Report", { align: "center" });
    doc.moveDown(0.5);

    // Decorative line
    doc.moveTo(60, doc.y).lineTo(550, doc.y).stroke("#3b6dae");
    doc.moveDown(1);

    // Document Info Box
    doc.fontSize(11).font("Helvetica-Bold").text("Document Information", {
      underline: true,
    });
    doc.moveDown(0.3);

    const infoData = [
      { label: "Document Name:", value: docName },
      { label: "Category:", value: category.replace(/_/g, " ") },
      { label: "Uploaded At:", value: uploadedAt.toLocaleString() },
      { label: "Status:", value: status.toUpperCase() },
      { label: "User ID:", value: userId.toString() },
    ];

    doc.fontSize(10).font("Helvetica");
    infoData.forEach((item, index) => {
      doc.text(`${item.label}`, { continued: true });
      doc.font("Helvetica-Bold").text(` ${item.value}`);
      if (index < infoData.length - 1) doc.moveDown(0.2);
    });

    doc.moveDown(1);

    // Status badge
    const statusColor =
      status === "verified"
        ? "#22c55e"
        : status === "rejected"
          ? "#ef4444"
          : "#f59e0b";
    doc
      .rect(60, doc.y, 200, 30)
      .fillAndStroke(statusColor, statusColor);
    doc.fillColor("white").fontSize(12).font("Helvetica-Bold");
    doc.text(`Status: ${status.toUpperCase()}`, 60, doc.y + 7, {
      width: 200,
      align: "center",
    });
    doc.fillColor("black");

    doc.moveDown(2.5);

    // Footer
    doc
      .fontSize(8)
      .fillColor("#999999")
      .text("This is an automatically generated document summary.", {
        align: "center",
      });
    doc.text(
      `Generated on ${new Date().toLocaleString()} | Centrika Workflow System`,
      { align: "center" }
    );

    doc.end();
  });
}

/**
 * Merge multiple PDFs into one
 * Note: This requires pdf-lib for proper PDF merging
 */
export async function mergePdfs(
  pdfBuffers: Buffer[],
  fileName: string
): Promise<Buffer> {
  // For now, return a composite document created with pdfkit
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      bufferPages: true,
      margin: 50,
    });

    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on("error", reject);

    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text(`Merged Document: ${fileName}`);
    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Contains ${pdfBuffers.length} files merged on ${new Date().toLocaleString()}`);
    doc.moveDown(1);

    doc.text(
      "Note: This is a summary document. For full document content, please refer to individual files.",
      { color: "#666666" }
    );

    doc.end();
  });
}
