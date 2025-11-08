"use client";

import type { TimeEntryWithUser } from "@/types";
import { Badge } from "@/components/ui/badge";
import { formatIsoToLocalDateTime, isoToLocalTimeInput, formatMinutesToHoursAndMinutes } from "@/utils/date";
import { Loader2 } from "lucide-react";

const statusBadge: Record<TimeEntryWithUser["status"], "success" | "danger" | "warning"> = {
  approved: "success",
  rejected: "danger",
  pending: "warning",
};

interface AdminEntriesTableProps {
  entries: TimeEntryWithUser[];
  selectedIds: Set<string>;
  onToggle: (entryId: string) => void;
  loading?: boolean;
}

export function AdminEntriesTable({ entries, selectedIds, onToggle, loading }: AdminEntriesTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-[rgb(var(--color-border))] bg-white shadow-sm dark:bg-[rgb(var(--color-surface))]">
      {/* Mobile-friendly: Add horizontal scroll wrapper */}
      <div className="overflow-x-auto">
        <table data-testid="admin-entries-table" className="min-w-full divide-y divide-[rgb(var(--color-border))]">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-[rgb(var(--color-subtle))] dark:bg-slate-900/40">
            <tr>
              <th className="bg-slate-50 px-4 py-3 text-left dark:bg-slate-900/40">
                <span className="sr-only">Select</span>
              </th>
              <th className="px-4 py-3 text-left dark:bg-slate-900/40">Employee</th>
              <th className="px-4 py-3 text-left whitespace-nowrap">Date</th>
              <th className="px-4 py-3 text-left whitespace-nowrap">Start</th>
              <th className="px-4 py-3 text-left whitespace-nowrap">End</th>
              <th className="px-4 py-3 text-left whitespace-nowrap">Hours</th>
              <th className="px-4 py-3 text-left whitespace-nowrap">Status</th>
              <th className="px-4 py-3 text-left whitespace-nowrap">Note</th>
              <th className="px-4 py-3 text-left whitespace-nowrap">Review</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgb(var(--color-border))] text-sm">
            {entries.map((entry) => {
              const endTimeLabel = entry.endUtc ? isoToLocalTimeInput(entry.endUtc) : "--";
              const durationLabel = formatMinutesToHoursAndMinutes(entry.totalMinutes);
              return (
                <tr
                  key={entry.id}
                  data-testid="admin-entry-row"
                  className="bg-white transition hover:bg-slate-50 dark:bg-[rgb(var(--color-surface))] dark:hover:bg-slate-800/80"
                >
                  <td className="bg-white px-4 py-4 dark:bg-[rgb(var(--color-surface))]">
                    <input
                      type="checkbox"
                      data-testid={`admin-entry-checkbox-${entry.id}`}
                      aria-label={`Select entry ${entry.id}`}
                      checked={selectedIds.has(entry.id)}
                      onChange={() => onToggle(entry.id)}
                      className="h-4 w-4 rounded border-[rgb(var(--color-border))] text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="bg-white px-4 py-4 dark:bg-[rgb(var(--color-surface))]">
                    <div className="flex flex-col min-w-[150px]">
                      <span className="font-medium">{entry.user?.displayName ?? entry.userId}</span>
                      <span className="text-xs text-[rgb(var(--color-subtle))]">{entry.user?.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">{entry.date}</td>
                  <td className="px-4 py-4 whitespace-nowrap">{isoToLocalTimeInput(entry.startUtc)}</td>
                  <td className="px-4 py-4 whitespace-nowrap">{endTimeLabel}</td>
                  <td className="px-4 py-4 whitespace-nowrap">{durationLabel}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <Badge variant={statusBadge[entry.status]}>{entry.status}</Badge>
                  </td>
                  <td className="px-4 py-4 max-w-xs truncate" title={entry.note ?? ""}>
                    {entry.note ?? <span className="text-[rgb(var(--color-subtle))]">--</span>}
                  </td>
                  <td className="px-4 py-4 max-w-xs truncate" title={entry.reviewNote ?? ""}>
                    {entry.reviewNote ?? <span className="text-[rgb(var(--color-subtle))]">--</span>}
                    {entry.approvedAt ? (
                      <span className="block text-xs text-[rgb(var(--color-subtle))] whitespace-nowrap">
                        {formatIsoToLocalDateTime(entry.approvedAt)}
                      </span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!entries.length && (
        <div className="flex items-center justify-center gap-3 px-6 py-16 text-sm text-[rgb(var(--color-subtle))]">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? "Loading entries..." : "Nothing to review yet. Adjust your filters above."}
        </div>
      )}
    </div>
  );
}
