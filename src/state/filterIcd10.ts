export interface Icd10Entry {
  code: string;
  description: string;
}

/**
 * Case-insensitive substring match on both code and description.
 * Matches whose code starts with the query rank first (typing "E11"
 * should surface E11.9 before a description that merely contains "e11").
 * Render cost is bounded by `limit` regardless of list size.
 */
export function filterIcd10(entries: Icd10Entry[], query: string, limit = 20): Icd10Entry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const codeMatches: Icd10Entry[] = [];
  const textMatches: Icd10Entry[] = [];
  for (const entry of entries) {
    if (entry.code.toLowerCase().startsWith(q)) {
      codeMatches.push(entry);
    } else if (
      entry.code.toLowerCase().includes(q) ||
      entry.description.toLowerCase().includes(q)
    ) {
      textMatches.push(entry);
    }
    if (codeMatches.length >= limit) break;
  }
  return [...codeMatches, ...textMatches].slice(0, limit);
}
