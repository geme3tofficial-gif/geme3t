export function formatNaira(value: number | string | null | undefined) {
  const amount = Math.max(0, Number(value ?? 0) || 0);
  return `₦${Math.round(amount).toLocaleString("en-NG")}`;
}
