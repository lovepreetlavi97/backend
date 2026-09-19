/**
 * Normalizes any image or video path/URL to strictly "folder/filename".
 * Strips any protocol, host, domain, and "/uploads/" prefix.
 *
 * Examples:
 * - "http://localhost:5000/uploads/products/temp/123/img.png" -> "products/temp/123/img.png"
 * - "https://api.gurujewellers.in/uploads/categories/abc.webp" -> "categories/abc.webp"
 * - "https://xpernex-storage.s3.us-east-1.amazonaws.com/banners/hero.webp" -> "banners/hero.webp"
 * - "/uploads/products/abc.png" -> "products/abc.png"
 * - "products/abc.png" -> "products/abc.png"
 */
export function normalizeMediaKey(input?: string | null): string {
  if (!input || typeof input !== 'string') return '';
  let str = input.trim();
  if (!str) return '';

  // Extract after '/uploads/' if present
  if (str.includes('/uploads/')) {
    str = str.split('/uploads/')[1];
  } else if (str.startsWith('http://') || str.startsWith('https://')) {
    try {
      const url = new URL(str);
      str = url.pathname;
      if (str.includes('/uploads/')) {
        str = str.split('/uploads/')[1];
      }
    } catch {
      // keep str
    }
  }

  // Remove leading slashes and redundant prefixes
  str = str.replace(/^\/+/, '');
  if (str.startsWith('uploads/')) {
    str = str.replace(/^uploads\//, '');
  }

  return str.trim();
}

export function normalizeMediaKeyList(inputs?: (string | null | undefined)[]): string[] {
  if (!Array.isArray(inputs)) return [];
  return inputs
    .map((img) => normalizeMediaKey(img))
    .filter((img) => img.length > 0);
}
