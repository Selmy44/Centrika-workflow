import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

type ExportOptions = {
  element: HTMLElement;
  fileName: string;
};

type PrintOptions = {
  element: HTMLElement;
  title?: string;
};

export function getActiveFormElement(): HTMLElement | null {
  const candidates = Array.from(document.querySelectorAll<HTMLElement>(".leave-form-container"));
  const visible = candidates.filter((el) => {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0"
    );
  });

  if (!visible.length) return candidates[0] ?? null;

  return visible.sort((a, b) => {
    const ar = a.getBoundingClientRect();
    const br = b.getBoundingClientRect();
    return br.width * br.height - ar.width * ar.height;
  })[0];
}

export async function exportFormToPdf({ element, fileName }: ExportOptions): Promise<void> {
  let pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const pageWidthMm = pdf.internal.pageSize.getWidth();
  const pageHeightMm = pdf.internal.pageSize.getHeight();
  const targetWidthPx = Math.max(1000, Math.floor(element.scrollWidth || element.clientWidth || 1000));
  const totalHeightPx = Math.max(Math.floor(element.scrollHeight || element.clientHeight || 1), 1);
  const pageHeightPx = Math.floor(targetWidthPx * (pageHeightMm / pageWidthMm));

  const renderPaged = async (opts: { scale: number; useCors: boolean; stripRemote: boolean }) => {
    let y = 0;
    let isFirst = true;

    while (y < totalHeightPx) {
      const sliceHeightPx = Math.min(pageHeightPx, totalHeightPx - y);
      const canvas = await html2canvas(element, {
        scale: opts.scale,
        useCORS: opts.useCors,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        width: targetWidthPx,
        height: sliceHeightPx,
        x: 0,
        y,
        scrollX: 0,
        scrollY: 0,
        ignoreElements: (node) =>
          node instanceof HTMLElement && node.classList.contains("no-print"),
        onclone: opts.stripRemote
          ? (doc) => {
              const images = Array.from(doc.querySelectorAll("img"));
              images.forEach((img) => {
                const src = img.getAttribute("src") || "";
                if (/^https?:\/\//i.test(src)) {
                  img.removeAttribute("src");
                  img.style.border = "1px dashed #cbd5e1";
                  img.style.minHeight = "32px";
                }
              });
            }
          : undefined,
      });

      const imgData = canvas.toDataURL("image/png");
      const sliceHeightMm = (canvas.height * pageWidthMm) / canvas.width;
      if (!isFirst) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, 0, pageWidthMm, sliceHeightMm, undefined, "FAST");
      isFirst = false;
      y += sliceHeightPx;
    }
  };

  try {
    await renderPaged({ scale: 1.4, useCors: true, stripRemote: false });
  } catch (primaryError) {
    console.error("[PDF Export] Primary visual capture failed:", primaryError);
    try {
      // reset document and retry with safer options
      pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
      await renderPaged({ scale: 1.1, useCors: false, stripRemote: true });
    } catch (fallbackError) {
      console.error("[PDF Export] Fallback visual capture failed:", fallbackError);
      const text = (element.innerText || "").replace(/\n{3,}/g, "\n\n").slice(0, 20000);
      const lines = pdf.splitTextToSize(
        text || "Form export failed to render visual layout. Please use Print Form.",
        pageWidthMm - 16
      );
      let cursorY = 12;
      lines.forEach((line: string) => {
        if (cursorY > pageHeightMm - 10) {
          pdf.addPage();
          cursorY = 12;
        }
        pdf.text(line, 8, cursorY);
        cursorY += 5.2;
      });
    }
  }

  pdf.save(fileName);
}

export function printFormElement({ element, title = "Request Form" }: PrintOptions): void {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) {
    document.body.removeChild(iframe);
    throw new Error("Unable to initialize print frame");
  }

  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((node) => node.outerHTML)
    .join("\n");

  doc.open();
  doc.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>${title}</title>
        ${styles}
        <style>
          @page { size: A4; margin: 10mm; }
          html, body { margin: 0; background: #fff; }
          .no-print { display: none !important; }
        </style>
      </head>
      <body>${element.outerHTML}</body>
    </html>
  `);
  doc.close();

  const printNow = () => {
    const win = iframe.contentWindow;
    if (!win) return;
    win.focus();
    win.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
    }, 400);
  };

  if (iframe.contentWindow?.document?.readyState === "complete") {
    setTimeout(printNow, 120);
  } else {
    iframe.onload = () => setTimeout(printNow, 120);
  }
}
