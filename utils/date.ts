import { differenceInMinutes, parseISO } from "date-fns";

const isoDateFormatterCache = new Map<string, Intl.DateTimeFormat>();
const isoDateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});
const isoTimeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
});

function getDateFormatter(timeZone: string) {
  if (!isoDateFormatterCache.has(timeZone)) {
    isoDateFormatterCache.set(
      timeZone,
      new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }),
    );
  }

  return isoDateFormatterCache.get(timeZone)!;
}

export function combineDateAndTimeToUtc(date: string, time: string): string {
  const isoInput = `${date}T${time}:00`;
  const asDate = new Date(isoInput);
  if (Number.isNaN(asDate.getTime())) {
    throw new Error("Invalid date or time supplied");
  }
  return asDate.toISOString();
}

export function getMinutesBetween(startUtc: string, endUtc: string): number {
  const start = parseISO(startUtc);
  const end = parseISO(endUtc);
  const minutes = differenceInMinutes(end, start);
  if (minutes <= 0) {
    throw new Error("endUtc must be after startUtc");
  }
  return minutes;
}

export function isoDateInTimezone(iso: string, timeZone: string): string {
  const formatter = getDateFormatter(timeZone);
  return formatter.format(new Date(iso));
}

export function isDateInFuture(date: string, timeZone: string): boolean {
  const formatter = getDateFormatter(timeZone);
  const today = formatter.format(new Date());
  return date > today;
}

export function isDateMatching(iso: string, date: string, timeZone: string): boolean {
  return isoDateInTimezone(iso, timeZone) === date;
}

export function formatIsoToLocalDateTime(iso?: string): string {
  if (!iso) return "";
  try {
    return isoDateTimeFormatter.format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatIsoToLocalTime(iso?: string): string {
  if (!iso) return "";
  try {
    return isoTimeFormatter.format(new Date(iso));
  } catch {
    return iso;
  }
}

export function isoToLocalTimeInput(iso: string): string {
  const date = new Date(iso);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}


