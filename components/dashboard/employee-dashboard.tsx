"use client";

import { useMemo, useState } from "react";
import type { TimeEntry } from "@/types";
import { TimeEntryForm } from "@/components/dashboard/time-entry-form";
import { EntriesList } from "@/components/dashboard/entries-list";
import { clockIn, clockOut, deleteTimeEntry, updateTimeEntry } from "@/lib/api/timeEntries";
import type { TimeEntryPayloadInput } from "@/lib/validation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Toast } from "@/components/ui/toast";
import { AuthGate } from "@/components/auth/auth-gate";
import { Spinner } from "@/components/ui/spinner";

interface EmployeeDashboardProps {
  initialEntries: TimeEntry[];
}

export function EmployeeDashboard({ initialEntries }: EmployeeDashboardProps) {
  const [entries, setEntries] = useState<TimeEntry[]>(initialEntries);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [confirming, setConfirming] = useState<TimeEntry | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; variant?: "success" | "error" | "info" }>({
    open: false,
    message: "",
    variant: "info",
  });

  const activeEntry = useMemo(() => {
    let latest: TimeEntry | null = null;
    for (const entry of entries) {
      if (entry.endUtc) continue;
      if (!latest || entry.startUtc > latest.startUtc) {
        latest = entry;
      }
    }
    return latest;
  }, [entries]);

  const resetToast = () => setToast((prev) => ({ ...prev, open: false }));

  const handleClockIn = async () => {
    const created = await clockIn();
    setEntries((prev) => {
      const withoutDuplicate = prev.filter((entry) => entry.id !== created.id);
      return [created, ...withoutDuplicate];
    });
    setToast({ open: true, message: "Clocked in", variant: "success" });
    return created;
  };

  const handleClockOut = async (note?: string) => {
    const completed = await clockOut({ note });
    setEntries((prev) => prev.map((entry) => (entry.id === completed.id ? completed : entry)));
    setToast({ open: true, message: "Clocked out", variant: "success" });
    return completed;
  };

  const handleEditSubmit = async (values: TimeEntryPayloadInput) => {
    if (!editingEntry) {
      throw new Error("No entry selected for editing");
    }

    const updated = await updateTimeEntry(editingEntry.id, values);
    setEntries((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)));
    setEditingEntry(null);
    setToast({ open: true, message: "Entry updated", variant: "success" });
    return updated;
  };

  const handleDelete = async (entry: TimeEntry) => {
    setConfirming(entry);
  };

  const confirmDelete = async () => {
    const entry = confirming;
    if (!entry) return;
    try {
      await deleteTimeEntry(entry.id);
      setEntries((prev) => prev.filter((item) => item.id !== entry.id));
      setToast({ open: true, message: "Entry removed", variant: "success" });
    } catch (error) {
      console.error(error);
      setToast({ open: true, message: error instanceof Error ? error.message : "Unable to delete entry", variant: "error" });
    } finally {
      setConfirming(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-[rgb(var(--color-foreground))]">
          {editingEntry ? "Edit entry" : "Track your time"}
        </h2>
        <p className="text-sm text-[rgb(var(--color-subtle))]">
          Clock in to start your day, clock out when you finish; edit or delete submissions while they are pending approval.
        </p>
      </div>

      {editingEntry ? (
        <TimeEntryForm
          initialEntry={editingEntry}
          submitRequest={handleEditSubmit}
          onCancelEdit={() => setEditingEntry(null)}
        />
      ) : (
        <TimeEntryForm
          activeEntry={activeEntry}
          onClockIn={handleClockIn}
          onClockOut={handleClockOut}
        />
      )}

      <section className="flex flex-col gap-4">
        <header className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Recent submissions</h3>
            <p className="text-sm text-[rgb(var(--color-subtle))]">
              Status updates will appear instantly when managers review your entries.
            </p>
          </div>
        </header>
        <AuthGate fallback={<Spinner label="Loading entries" />}>
          <EntriesList
            entries={entries}
            onEdit={(entry) => setEditingEntry(entry)}
            onDelete={handleDelete}
          />
        </AuthGate>
      </section>

      <ConfirmDialog
        open={Boolean(confirming)}
        title="Delete time entry?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setConfirming(null)}
      />

      <Toast open={toast.open} message={toast.message} variant={toast.variant} onClose={resetToast} />
    </div>
  );
}
