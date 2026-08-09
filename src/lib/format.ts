import { format as fnsFormat, parseISO, isValid } from "date-fns";

export function formatTZS(amount: number | null | undefined): string {
  const n = Number(amount ?? 0);
  const rounded = Math.round(n);
  return `TZS ${rounded.toLocaleString("en-TZ")}`;
}

export function formatDate(
  value: string | Date | null | undefined,
  pattern = "dd MMM yyyy"
): string {
  if (!value) return "—";
  const date = typeof value === "string" ? parseISO(value) : value;
  if (!isValid(date)) return "—";
  return fnsFormat(date, pattern);
}

export function formatDateTime(value: string | Date | null | undefined): string {
  return formatDate(value, "dd MMM yyyy, HH:mm");
}

export function roundMoney(n: number) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

export function calcVatInclusive(subtotalExVat: number, vatRate = 18) {
  const subtotal = roundMoney(subtotalExVat);
  const vatAmount = roundMoney(subtotal * (vatRate / 100));
  return { subtotal, vatAmount, total: roundMoney(subtotal + vatAmount) };
}
