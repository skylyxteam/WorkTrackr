import type { TimeEntryWithUser } from "@/types";
import { formatIsoToLocalDateTime } from "@/utils/date";

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function timeEntriesToCsv(entries: TimeEntryWithUser[]): string {
  const header = [
    "Date",
    "Employee",
    "Email",
    "Start (local)",
    "End (local)",
    "Total Minutes",
    "Status",
    "Note",
    "Review Note",
    "Approved By",
    "Approved At",
  ];

  const rows = entries.map((entry) => [
    entry.date,
    entry.user?.displayName ?? entry.userId,
    entry.user?.email ?? "",
    formatIsoToLocalDateTime(entry.startUtc),
    formatIsoToLocalDateTime(entry.endUtc),
    entry.totalMinutes,
    entry.status,
    entry.note ?? "",
    entry.reviewNote ?? "",
    entry.approvedBy ?? "",
    entry.approvedAt ? formatIsoToLocalDateTime(entry.approvedAt) : "",
  ]);

  return [header, ...rows]
    .map((columns) => columns.map(escapeCsv).join(","))
    .join("\n");
}
