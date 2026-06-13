export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'];
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

export type FileValidation = { ok: true } | { ok: false; error: string };

export function validateFile(name: string, size: number, mimeType: string): FileValidation {
  const ext = name.includes('.') ? name.split('.').pop()!.toLowerCase() : '';
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { ok: false, error: 'Only PDF, JPG or PNG files are accepted.' };
  }
  // Browsers sometimes report an empty MIME type — fall back to the extension check.
  if (mimeType && !ALLOWED_MIME_TYPES.includes(mimeType)) {
    return { ok: false, error: 'Only PDF, JPG or PNG files are accepted.' };
  }
  if (size > MAX_FILE_SIZE) {
    return { ok: false, error: 'File is larger than the 10MB limit.' };
  }
  return { ok: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}
