import { describe, expect, it } from 'vitest';
import { MAX_FILE_SIZE, validateFile } from '../validateFile';

describe('validateFile — type and size rules', () => {
  it('accepts PDF, JPG and PNG', () => {
    expect(validateFile('receipt.pdf', 1024, 'application/pdf')).toEqual({ ok: true });
    expect(validateFile('receipt.JPG', 1024, 'image/jpeg')).toEqual({ ok: true });
    expect(validateFile('receipt.png', 1024, 'image/png')).toEqual({ ok: true });
  });

  it('rejects other extensions', () => {
    expect(validateFile('receipt.docx', 1024, 'application/vnd.openxmlformats').ok).toBe(false);
    expect(validateFile('receipt', 1024, '').ok).toBe(false);
  });

  it('rejects a spoofed extension with a disallowed MIME type', () => {
    expect(validateFile('receipt.pdf', 1024, 'application/x-msdownload').ok).toBe(false);
  });

  it('accepts a file with empty MIME type if the extension is allowed', () => {
    expect(validateFile('receipt.pdf', 1024, '')).toEqual({ ok: true });
  });

  it('enforces the 10MB boundary inclusively', () => {
    expect(validateFile('big.jpg', MAX_FILE_SIZE, 'image/jpeg')).toEqual({ ok: true });
    expect(validateFile('big.jpg', MAX_FILE_SIZE + 1, 'image/jpeg').ok).toBe(false);
  });
});
