/**
 * Format a numeric value as a currency string with 2 decimal places.
 * Returns "—" for null/undefined values.
 */
export function formatCurrency(
  value: number | null | undefined,
  _currency?: string,
): string {
  if (value == null) return "—";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
