export function formatMoney(value: number | undefined | null): string {
  return Number(value ?? 0)?.toFixed(2);
}
