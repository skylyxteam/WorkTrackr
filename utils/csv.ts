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
    "Total Hours",
    "Status",
    "Note",
    "Review Note",
    "Approved By",
    "Approved At",
  ];

  const rows = entries.map((entry) => {
    // For CSV, use decimal hours (easier for spreadsheets/payroll)
    const hours = entry.totalMinutes != null ? (entry.totalMinutes / 60).toFixed(2) : "";

    return [
      entry.date,
      entry.user?.displayName ?? entry.userId,
      entry.user?.email ?? "",
      formatIsoToLocalDateTime(entry.startUtc),
      entry.endUtc ? formatIsoToLocalDateTime(entry.endUtc) : "",
      hours,
      entry.status,
      entry.note ?? "",
      entry.reviewNote ?? "",
      entry.approvedBy ?? "",
      entry.approvedAt ? formatIsoToLocalDateTime(entry.approvedAt) : "",
    ];
  });

  const csvContent = [header, ...rows]
    .map((columns) => columns.map(escapeCsv).join(","))
    .join("\r\n"); // Use Windows line endings for better Excel compatibility
    
  // Add UTF-8 BOM for proper character encoding in Excel and other programs
  return "\uFEFF" + csvContent;
}
