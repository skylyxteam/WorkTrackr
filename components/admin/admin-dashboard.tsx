"use client";

import { useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import type { TimeEntryWithUser, TimeEntryStatus, UserProfile } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Toast } from "@/components/ui/toast";
import { CSVExportButton } from "@/components/admin/csv-export-button";
import { AdminEntriesTable } from "@/components/admin/admin-entries-table";
import { bulkApproveEntries, fetchTimeEntries } from "@/lib/api/timeEntries";
import type { ExportQueryInput } from "@/lib/validation";

interface AdminDashboardProps {
  initialEntries: TimeEntryWithUser[];
  employees: UserProfile[];
}

type FilterState = {
  status: TimeEntryStatus | "all";
  startDate?: string;
  endDate?: string;
  userId?: string;
};

const statusOptions: Array<{ value: FilterState["status"]; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

export function AdminDashboard({ initialEntries, employees }: AdminDashboardProps) {
  const [entries, setEntries] = useState<TimeEntryWithUser[]>(initialEntries);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterState>({ status: "pending" });
  const [reviewNote, setReviewNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; variant?: "success" | "error" | "info" }>({
    open: false,
    message: "",
    variant: "info",
  });

  const resetToast = () => setToast((prev) => ({ ...prev, open: false }));

  const totalPending = useMemo(
    () => entries.filter((entry) => entry.status === "pending").length,
    [entries],
  );

  const handleToggle = (entryId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) {
        next.delete(entryId);
      } else {
        next.add(entryId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (!entries.length) return;
    if (selected.size === entries.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(entries.map((entry) => entry.id)));
    }
  };

  const applyFilters = async () => {
    setLoading(true);
    try {
      const params: Partial<ExportQueryInput> = {
        status: filters.status,
        userId: filters.userId,
        startDate: filters.startDate,
        endDate: filters.endDate,
      };
      const fresh = (await fetchTimeEntries(params)) as TimeEntryWithUser[];
      setEntries(fresh);
      setSelected(new Set());
    } catch (error) {
      console.error(error);
      setToast({ open: true, message: "Failed to load entries", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({ status: "pending" });
  };

  const runBulkAction = async (status: Exclude<TimeEntryStatus, "pending">) => {
    if (!selected.size) return;
    setBulkLoading(true);
    try {
      await bulkApproveEntries({
        entryIds: Array.from(selected),
        status,
        reviewNote: reviewNote.trim() || undefined,
      });

      const nowIso = new Date().toISOString();
      setEntries((prev) =>
        prev.map((entry) =>
          selected.has(entry.id)
            ? {
                ...entry,
                status,
                reviewNote: reviewNote.trim() || undefined,
                approvedBy: "you",
                approvedAt: nowIso,
              }
            : entry,
        ),
      );
      setSelected(new Set());
      setReviewNote("");
      setToast({
        open: true,
        message: status === "approved" ? "Entries approved" : "Entries rejected",
        variant: "success",
      });
    } catch (error) {
      console.error(error);
      setToast({ open: true, message: "Bulk update failed", variant: "error" });
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-6 rounded-xl border border-[rgb(var(--color-border))] bg-white p-6 shadow-sm dark:bg-[rgb(var(--color-surface))]">
        <header className="flex flex-col gap-2">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase text-blue-600">
            <ShieldCheck className="h-4 w-4" /> Admin controls
          </span>
          <h2 className="text-xl font-semibold">Review submissions</h2>
          <p className="text-sm text-[rgb(var(--color-subtle))]">
            {totalPending} entries waiting for a decision.
          </p>
        </header>

        <div className="grid gap-4 rounded-lg border border-dashed border-[rgb(var(--color-border))] bg-slate-50/60 p-4 dark:bg-slate-900/30">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="grid gap-2">
              <label className="text-xs uppercase tracking-wide text-[rgb(var(--color-subtle))]" htmlFor="status-filter">
                Status
              </label>
              <Select
                id="status-filter"
                value={filters.status}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: event.target.value as FilterState["status"],
                  }))
                }
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-xs uppercase tracking-wide text-[rgb(var(--color-subtle))]" htmlFor="employee-filter">
                Employee
              </label>
              <Select
                id="employee-filter"
                value={filters.userId ?? ""}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    userId: event.target.value || undefined,
                  }))
                }
              >
                <option value="">All employees</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.displayName || employee.email}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-xs uppercase tracking-wide text-[rgb(var(--color-subtle))]" htmlFor="start-date">
                Start date
              </label>
              <Input
                id="start-date"
                type="date"
                value={filters.startDate ?? ""}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    startDate: event.target.value || undefined,
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs uppercase tracking-wide text-[rgb(var(--color-subtle))]" htmlFor="end-date">
                End date
              </label>
              <Input
                id="end-date"
                type="date"
                value={filters.endDate ?? ""}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    endDate: event.target.value || undefined,
                  }))
                }
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={applyFilters} loading={loading}>
              Apply filters
            </Button>
            <Button type="button" variant="ghost" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold">Matching entries</h3>
            <span className="text-sm text-[rgb(var(--color-subtle))]">
              {entries.length} total rows • {selected.size} selected
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Input
              placeholder="Add a review note (optional)"
              value={reviewNote}
              onChange={(event) => setReviewNote(event.target.value)}
              className="w-64"
            />
            <CSVExportButton params={filters} />
            <Button type="button" variant="outline" onClick={handleSelectAll} disabled={!entries.length}>
              {selected.size === entries.length ? "Clear selection" : "Select all"}
            </Button>
            <Button
              type="button"
              onClick={() => runBulkAction("approved")}
              disabled={!selected.size}
              loading={bulkLoading}
            >
              Approve
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => runBulkAction("rejected")}
              disabled={!selected.size}
              loading={bulkLoading}
            >
              Reject
            </Button>
          </div>
        </header>

        <AdminEntriesTable entries={entries} selectedIds={selected} onToggle={handleToggle} loading={loading} />
      </section>

      <Toast open={toast.open} message={toast.message} variant={toast.variant} onClose={resetToast} />
    </div>
  );
}
