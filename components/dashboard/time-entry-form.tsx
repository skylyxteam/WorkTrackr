"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import type { TimeEntry } from "@/types";
import { timeEntryPayloadSchema, type TimeEntryPayloadInput } from "@/lib/validation";
import { formatIsoToLocalDateTime, isoToLocalTimeInput } from "@/utils/date";

interface SharedProps {
  onSubmitSuccess?: (entry: TimeEntry) => void;
  onCancelEdit?: () => void;
}

interface ClockModeProps extends SharedProps {
  initialEntry?: null;
  activeEntry?: TimeEntry | null;
  onClockIn: () => Promise<TimeEntry>;
  onClockOut: (note?: string) => Promise<TimeEntry>;
}

interface EditModeProps extends SharedProps {
  initialEntry: TimeEntry;
  submitRequest: (values: TimeEntryPayloadInput) => Promise<TimeEntry>;
}

type TimeEntryFormProps = ClockModeProps | EditModeProps;

type LoadingState = "clock-in" | "clock-out" | null;

function isEditMode(props: TimeEntryFormProps): props is EditModeProps {
  return Boolean((props as EditModeProps).initialEntry);
}

function formatElapsed(startUtc: string): string {
  const start = new Date(startUtc).getTime();
  if (Number.isNaN(start)) {
    return "--";
  }
  const diffSeconds = Math.max(Math.floor((Date.now() - start) / 1000), 0);
  const hours = Math.floor(diffSeconds / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  const seconds = diffSeconds % 60;
  const parts: string[] = [];
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  parts.push(`${minutes.toString().padStart(2, "0")}m`);
  parts.push(`${seconds.toString().padStart(2, "0")}s`);
  return parts.join(" ");
}

function ClockControls({
  activeEntry,
  onClockIn,
  onClockOut,
  onSubmitSuccess,
}: ClockModeProps) {
  const [note, setNote] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<LoadingState>(null);
  const [elapsed, setElapsed] = useState<string | null>(null);

  useEffect(() => {
    if (activeEntry?.note) {
      setNote(activeEntry.note);
    } else {
      setNote("");
    }
  }, [activeEntry?.id, activeEntry?.note]);

  useEffect(() => {
    if (!activeEntry) {
      setElapsed(null);
      return;
    }

    const updateElapsed = () => {
      setElapsed(formatElapsed(activeEntry.startUtc));
    };

    updateElapsed();
    const intervalId = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(intervalId);
  }, [activeEntry?.startUtc]);

  const handleClockIn = async () => {
    if (loading) return;
    setError(null);
    setLoading("clock-in");
    try {
      const entry = await onClockIn();
      setNote(entry.note ?? "");
      onSubmitSuccess?.(entry);
    } catch (clockError) {
      console.error(clockError);
      setError(clockError instanceof Error ? clockError.message : "Unable to clock in");
    } finally {
      setLoading(null);
    }
  };

  const handleClockOut = async () => {
    if (loading) return;
    setError(null);
    setLoading("clock-out");
    try {
      const trimmed = note?.trim();
      const entry = await onClockOut(trimmed ? trimmed : undefined);
      setNote("");
      onSubmitSuccess?.(entry);
    } catch (clockError) {
      console.error(clockError);
      setError(clockError instanceof Error ? clockError.message : "Unable to clock out");
    } finally {
      setLoading(null);
    }
  };

  const clockedIn = Boolean(activeEntry);
  const statusLabel = clockedIn
    ? `Clocked in since ${formatIsoToLocalDateTime(activeEntry!.startUtc)}`
    : "Not clocked in";

  return (
    <div
      className="grid gap-4 rounded-xl border border-[rgb(var(--color-border))] bg-white p-6 shadow-sm dark:bg-[rgb(var(--color-surface))]"
      data-testid="time-entry-controls"
    >
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-[rgb(var(--color-subtle))]">Current status</span>
        <span className="text-lg font-semibold text-[rgb(var(--color-foreground))]" data-testid="clock-status">
          {statusLabel}
        </span>
        {clockedIn && elapsed ? (
          <span className="text-sm text-[rgb(var(--color-subtle))]" data-testid="clock-duration">
            Active for {elapsed}
          </span>
        ) : null}
      </div>

      {error ? (
        <Alert data-testid="time-entry-error" variant="danger">
          {error}
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button
          type="button"
          size="lg"
          data-testid="clock-in-button"
          disabled={clockedIn || loading === "clock-out"}
          loading={loading === "clock-in"}
          onClick={handleClockIn}
        >
          Clock In
        </Button>
        <Button
          type="button"
          size="lg"
          variant="outline"
          data-testid="clock-out-button"
          disabled={!clockedIn || loading === "clock-in"}
          loading={loading === "clock-out"}
          onClick={handleClockOut}
        >
          Clock Out
        </Button>
      </div>

      {clockedIn ? (
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="time-entry-note">
            Notes (optional)
          </label>
          <Textarea
            id="time-entry-note"
            data-testid="time-entry-note"
            rows={3}
            placeholder="Highlights, blockers, work context"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </div>
      ) : (
        <p className="text-sm text-[rgb(var(--color-subtle))]" data-testid="clock-note-hint">
          Notes can be added when you clock out.
        </p>
      )}
    </div>
  );
}

function EditEntryForm({
  initialEntry,
  submitRequest,
  onSubmitSuccess,
  onCancelEdit,
}: EditModeProps) {
  const [formError, setFormError] = useState<string | null>(null);

  const defaultValues = useMemo<TimeEntryPayloadInput>(() => ({
    date: initialEntry.date,
    startTime: isoToLocalTimeInput(initialEntry.startUtc),
    endTime: initialEntry.endUtc ? isoToLocalTimeInput(initialEntry.endUtc) : "",
    note: initialEntry.note ?? undefined,
  }), [initialEntry]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TimeEntryPayloadInput>({
    resolver: zodResolver(timeEntryPayloadSchema),
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const result = await submitRequest(values);
      onSubmitSuccess?.(result);
      reset(values);
    } catch (submitError) {
      console.error(submitError);
      setFormError(submitError instanceof Error ? submitError.message : "Something went wrong");
    }
  });

  return (
    <form
      data-testid="time-entry-form"
      onSubmit={onSubmit}
      className="grid gap-4 rounded-xl border border-[rgb(var(--color-border))] bg-white p-6 shadow-sm dark:bg-[rgb(var(--color-surface))]"
    >
      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="time-entry-date">
          Work date
        </label>
        <Input
          id="time-entry-date"
          data-testid="time-entry-date"
          type="date"
          {...register("date")}
        />
        {errors.date && <p className="text-sm text-red-600">{errors.date.message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="time-entry-start">
            Start time
          </label>
          <Input
            id="time-entry-start"
            data-testid="time-entry-start"
            type="time"
            {...register("startTime")}
          />
          {errors.startTime && <p className="text-sm text-red-600">{errors.startTime.message}</p>}
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="time-entry-end">
            End time
          </label>
          <Input
            id="time-entry-end"
            data-testid="time-entry-end"
            type="time"
            {...register("endTime")}
          />
          {errors.endTime && <p className="text-sm text-red-600">{errors.endTime.message}</p>}
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="time-entry-edit-note">
          Notes (optional)
        </label>
        <Textarea
          id="time-entry-edit-note"
          data-testid="time-entry-edit-note"
          rows={3}
          placeholder="Highlights, blockers, work context"
          {...register("note")}
        />
        {errors.note && <p className="text-sm text-red-600">{errors.note.message}</p>}
      </div>

      {formError ? (
        <Alert data-testid="time-entry-error" variant="danger">
          {formError}
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={onCancelEdit} data-testid="time-entry-cancel">
          Cancel edit
        </Button>
        <Button
          type="submit"
          loading={isSubmitting}
          className="ml-auto"
          data-testid="time-entry-submit"
        >
          Save changes
        </Button>
      </div>
    </form>
  );
}

export function TimeEntryForm(props: TimeEntryFormProps) {
  if (isEditMode(props)) {
    return <EditEntryForm {...props} />;
  }

  return <ClockControls {...props} />;
}
