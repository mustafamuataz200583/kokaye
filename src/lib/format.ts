export function formatIQD(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${Math.round(value).toLocaleString("en-US")} د.ع`;
}

export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

const dateFmt = new Intl.DateTimeFormat("ar-IQ-u-nu-latn", {
  timeZone: "Asia/Baghdad",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatDateTime(value: string | Date): string {
  return dateFmt.format(typeof value === "string" ? new Date(value) : value);
}

const dateOnlyFmt = new Intl.DateTimeFormat("ar-IQ-u-nu-latn", {
  timeZone: "Asia/Baghdad",
  month: "short",
  day: "numeric",
});

export function formatDate(value: string | Date): string {
  return dateOnlyFmt.format(typeof value === "string" ? new Date(value) : value);
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
