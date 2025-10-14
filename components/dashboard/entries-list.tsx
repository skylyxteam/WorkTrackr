"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import type { TimeEntry } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatIsoToLocalDateTime, isoToLocalTimeInput } from "@/utils/date";

const statusVariant: Record<TimeEntry["status"], "success" | "danger" | "warning"> = {
  approved: "success",
  rejected: "danger",
  pending: "warning",
};

interface EntriesListProps {
  entries: TimeEntry[];
  onEdit: (entry: TimeEntry) => void;
  onDelete: (entry: TimeEntry) => void;
}

export function EntriesList({ entries, onEdit, onDelete }: EntriesListProps) {
  if (!entries.length) {
    return (
      <div
        data-testid="entries-empty"
        className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[rgb(var(--color-border))] bg-white p-10 text-center text-sm text-[rgb(var(--color-subtle))] dark:bg-[rgb(var(--color-surface))]"
      >
        <span className="font-medium text-[rgb(var(--color-foreground))]">No submissions yet</span>
        <p>Submit your first entry to see it listed here.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[rgb(var(--color-border))] bg-white shadow-sm dark:bg-[rgb(var(--color-surface))]">
      {/* Mobile-friendly: Add horizontal scroll wrapper */}
      <div className="overflow-x-auto">
        <table data-testid="entries-table" className="min-w-full divide-y divide-[rgb(var(--color-border))]">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-[rgb(var(--color-subtle))] dark:bg-slate-900/40">
            <tr>
              <th className="px-4 py-3 text-left dark:bg-slate-900/40 whitespace-nowrap">Date</th>
              <th className="px-4 py-3 text-left whitespace-nowrap">Start</th>
              <th className="px-4 py-3 text-left whitespace-nowrap">End</th>
              <th className="px-4 py-3 text-left whitespace-nowrap">Minutes</th>
              <th className="px-4 py-3 text-left whitespace-nowrap">Status</th>
              <th className="px-4 py-3 text-left whitespace-nowrap">Notes</th>
              <th className="px-4 py-3 text-left whitespace-nowrap">Reviewed</th>
              <th className="px-4 py-3 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgb(var(--color-border))] text-sm">
            {entries.map((entry) => {
              const endTimeLabel = entry.endUtc ? isoToLocalTimeInput(entry.endUtc) : "--";
              const minutesLabel = entry.totalMinutes ?? "--";
              return (
                <tr
                  key={entry.id}
                  data-testid="employee-entry-row"
                  data-entry-id={entry.id}
                  className="bg-white transition hover:bg-slate-50 dark:bg-[rgb(var(--color-surface))] dark:hover:bg-slate-800/60"
                >
                  <td className="bg-white px-4 py-4 font-medium dark:bg-[rgb(var(--color-surface))] whitespace-nowrap">{entry.date}</td>
                  <td className="px-4 py-4 whitespace-nowrap">{isoToLocalTimeInput(entry.startUtc)}</td>
                  <td className="px-4 py-4 whitespace-nowrap">{endTimeLabel}</td>
                  <td className="px-4 py-4 whitespace-nowrap">{minutesLabel}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <Badge variant={statusVariant[entry.status]}>{entry.status}</Badge>
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
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2 whitespace-nowrap">
                      {entry.status === "pending" && (
                        <Button
                          variant="ghost"
                          onClick={() => onEdit(entry)}
                          data-testid={`edit-entry-${entry.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {entry.status === "pending" && (
                        <Button
                          variant="ghost"
                          onClick={() => onDelete(entry)}
                          className="text-red-600 hover:text-red-500"
                          data-testid={`delete-entry-${entry.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      {entry.status !== "pending" && entry.approvedBy && (
                        <Link
                          href="/profile"
                          className="text-xs text-[rgb(var(--color-subtle))] underline"
                        >
                          View reviewer
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
