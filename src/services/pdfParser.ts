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

      // Configure worker safely for browser / Android WebView
      if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
        try {
          if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
              'pdfjs-dist/build/pdf.worker.min.js',
              import.meta.url
            ).toString();
          }
        } catch {
          // In offline / worker-restricted WebView environments, fallback to fake worker
        }
      }

      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(pdfBuffer),
        useSystemFonts: true,
        isEvalSupported: false,
      });
      const pdfDoc = await loadingTask.promise;
      const pages: ParsedPdfPage[] = [];

      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const rawItems = textContent.items as Array<{
          str: string;
          transform?: number[];
          width?: number;
          height?: number;
        }>;

        const itemsWithCoords = rawItems
          .filter((item) => item.str && item.str.trim().length > 0)
          .map((item) => ({
            x: item.transform ? item.transform[4] : 0,
            y: item.transform ? item.transform[5] : 0,
            text: item.str,
          }));

        // Sort items top-to-bottom (Y descending) then left-to-right (X ascending)
        itemsWithCoords.sort((a, b) => {
          if (Math.abs(b.y - a.y) > 3) {
            return b.y - a.y;
          }
          return a.x - b.x;
        });

        // Group text items by vertical position with 3.5px line-height clustering
        const lineClusters: Array<Array<{ x: number; y: number; text: string }>> = [];
        for (const item of itemsWithCoords) {
          const matchingCluster = lineClusters.find(
            (cluster) => cluster.length > 0 && Math.abs(cluster[0].y - item.y) <= 3.5
          );
          if (matchingCluster) {
            matchingCluster.push(item);
          } else {
            lineClusters.push([item]);
          }
        }

        // Sort clusters from top to bottom
        lineClusters.sort((a, b) => {
          const avgYa = a.reduce((sum, it) => sum + it.y, 0) / a.length;
          const avgYb = b.reduce((sum, it) => sum + it.y, 0) / b.length;
          return avgYb - avgYa;
        });

        // Within each cluster, sort items left-to-right and join
        const lines: string[] = [];
        for (const cluster of lineClusters) {
          cluster.sort((a, b) => a.x - b.x);
          const lineStr = cluster.map((it) => it.text.trim()).filter(Boolean).join(' ');
          if (lineStr.length > 0) {
            lines.push(lineStr);
          }
        }

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
