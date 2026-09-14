/**
 * Robust cross-browser file download helper with Blob and Data URI fallbacks,
 * DOM attachment, and delayed teardown to prevent cancelled downloads in iframes/mobile.
 */
export async function downloadFile(
  content: string,
  filename: string,
  mimeType: string = 'application/json;charset=utf-8;'
): Promise<{ success: boolean; method: string; message: string }> {
  // Method 1: Standard Blob Object URL
  try {
    if (typeof window !== 'undefined' && typeof window.URL !== 'undefined' && typeof window.URL.createObjectURL === 'function') {
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.style.position = 'fixed';
      link.style.top = '-9999px';
      link.style.left = '-9999px';
      link.style.opacity = '0';
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.setAttribute('target', '_self');
      document.body.appendChild(link);

      // Trigger click
      link.click();
      try {
        link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      } catch {}

      // Keep link in DOM and maintain Blob URL for 2000ms so download manager captures it
      setTimeout(() => {
        try {
          if (link.parentNode) {
            link.parentNode.removeChild(link);
          }
          window.URL.revokeObjectURL(url);
        } catch {}
      }, 2000);

      return {
        success: true,
        method: 'blob_download',
        message: `Saved "${filename}" to your Downloads!`,
      };
    }
  } catch (blobErr) {
    console.warn('[downloadFile] Blob URL download failed, trying data URI fallback:', blobErr);
  }

  // Method 2: Data URI Fallback (essential when iframe sandboxes block blob downloads)
  try {
    const encoded = encodeURIComponent(content);
    const dataUri = `data:${mimeType},${encoded}`;
    const link = document.createElement('a');

    link.style.position = 'fixed';
    link.style.top = '-9999px';
    link.style.left = '-9999px';
    link.style.opacity = '0';
    link.setAttribute('href', dataUri);
    link.setAttribute('download', filename);
    link.setAttribute('target', '_self');
    document.body.appendChild(link);

    link.click();
    try {
      link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    } catch {}

    setTimeout(() => {
      try {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      } catch {}
    }, 2000);

    return {
      success: true,
      method: 'data_uri_download',
      message: `Saved "${filename}" via fallback!`,
    };
  } catch (dataErr) {
    console.error('[downloadFile] Both blob and data URI download failed:', dataErr);
    return {
      success: false,
      method: 'failed',
      message: 'Browser download blocked. You can use "Copy to Clipboard" to save your backup data.',
    };
  }
}

/**
 * Copies text safely to clipboard with fallback for iframes/older browsers
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback
    }
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '-9999px';
    textArea.style.left = '-9999px';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}
