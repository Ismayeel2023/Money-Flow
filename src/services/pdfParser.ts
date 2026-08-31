/**
 * PDF Parser Utility
 * Extracts plain text lines from PDF ArrayBuffer using pdfjs-dist.
 */

export interface ParsedPdfPage {
  pageNumber: number;
  lines: string[];
  fullText: string;
}

export class PdfParser {
  /**
   * Extracts text lines from PDF ArrayBuffer
   */
  public static async extractTextFromPdf(pdfBuffer: ArrayBuffer): Promise<ParsedPdfPage[]> {
    try {
      // Dynamic import to support both node test environments and browser runtime
      const pdfjsLib = await import('pdfjs-dist');
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) });
      const pdfDoc = await loadingTask.promise;
      const pages: ParsedPdfPage[] = [];

      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const items = textContent.items as Array<{ str: string; transform?: number[] }>;

        const lineMap: Record<number, string[]> = {};
        for (const item of items) {
          const y = item.transform ? Math.round(item.transform[5]) : 0;
          if (!lineMap[y]) lineMap[y] = [];
          lineMap[y].push(item.str);
        }

        // Sort descending by Y (top to bottom)
        const sortedY = Object.keys(lineMap)
          .map(Number)
          .sort((a, b) => b - a);

        const lines = sortedY.map((y) => lineMap[y].join(' ').trim()).filter((l) => l.length > 0);
        const fullText = lines.join('\n');

        pages.push({
          pageNumber: i,
          lines,
          fullText,
        });
      }

      return pages;
    } catch (err) {
      console.warn('[PdfParser] Fallback / extraction notice:', err);
      return [];
    }
  }
}
