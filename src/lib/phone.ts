/**
 * Iraqi mobile numbers.
 * Accepts: 07XXXXXXXXX, 7XXXXXXXXX, +9647XXXXXXXXX, 009647XXXXXXXXX,
 * with spaces/dashes and Arabic-Indic or Persian digits.
 * Normalizes to the local 11-digit form: 07XXXXXXXXX.
 */
const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN = "۰۱۲۳۴۵۶۷۸۹";

export function toLatinDigits(input: string): string {
  return input.replace(/[٠-٩۰-۹]/g, (d) => {
    const i = ARABIC_INDIC.indexOf(d);
    return String(i >= 0 ? i : PERSIAN.indexOf(d));
  });
}

export function normalizeIraqiPhone(input: string): string | null {
  let digits = toLatinDigits(input).replace(/[\s\-().]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (!/^\d+$/.test(digits)) return null;
  if (digits.startsWith("964")) digits = "0" + digits.slice(3);
  else if (digits.startsWith("7") && digits.length === 10) digits = "0" + digits;
  // Iraqi mobile operators use 075x–079x prefixes.
  if (!/^07[3-9]\d{8}$/.test(digits)) return null;
  return digits;
}

export function toInternational(local: string): string {
  return "964" + local.replace(/^0/, "");
}
