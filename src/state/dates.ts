export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
  );
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isFutureDate(value: string, today: Date = new Date()): boolean {
  return value > toIsoDate(today);
}

/**
 * Length of stay in nights (hospital convention): admission 2026-03-01 →
 * discharge 2026-03-04 = 3 nights; same-day discharge = 0.
 * Returns null when either date is invalid or discharge < admission.
 */
export function lengthOfStay(admissionDate: string, dischargeDate: string): number | null {
  if (!isValidIsoDate(admissionDate) || !isValidIsoDate(dischargeDate)) return null;
  const [ay, am, ad] = admissionDate.split('-').map(Number);
  const [dy, dm, dd] = dischargeDate.split('-').map(Number);
  const nights = Math.round(
    (Date.UTC(dy, dm - 1, dd) - Date.UTC(ay, am - 1, ad)) / 86_400_000,
  );
  return nights >= 0 ? nights : null;
}
