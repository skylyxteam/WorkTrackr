"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import type { TimeEntry } from "@/types";
import { timeEntryPayloadSchema, type TimeEntryPayloadInput } from "@/lib/validation";
import { isoToLocalTimeInput } from "@/utils/date";

interface TimeEntryFormProps {
  initialEntry?: TimeEntry | null;
  onSubmitSuccess?: (entry: TimeEntry) => void;
  onCancelEdit?: () => void;
  submitRequest: (values: TimeEntryPayloadInput) => Promise<TimeEntry>;
}

export function TimeEntryForm({ initialEntry, submitRequest, onSubmitSuccess, onCancelEdit }: TimeEntryFormProps) {
  const [formError, setFormError] = useState<string | null>(null);

  const defaultValues = useMemo<TimeEntryPayloadInput>(() => {
    if (!initialEntry) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      return {
        date: `${yyyy}-${mm}-${dd}`,
        startTime: "09:00",
        endTime: "17:00",
        note: undefined,
      };
    }

    return {
      date: initialEntry.date,
      startTime: isoToLocalTimeInput(initialEntry.startUtc),
      endTime: isoToLocalTimeInput(initialEntry.endUtc),
      note: initialEntry.note ?? undefined,
    };
  }, [initialEntry]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TimeEntryPayloadInput>({
    resolver: zodResolver(timeEntryPayloadSchema) as Resolver<TimeEntryPayloadInput>,
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
      if (!initialEntry) {
        reset({ ...values, note: undefined });
      }
    } catch (error) {
      console.error(error);
      setFormError(error instanceof Error ? error.message : "Something went wrong");
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
        <label className="text-sm font-medium" htmlFor="time-entry-note">
          Notes (optional)
        </label>
        <Textarea
          id="time-entry-note"
          data-testid="time-entry-note"
          rows={3}
          placeholder="Highlights, blockers, work context"
          {...register("note")}
        />
        {errors.note && <p className="text-sm text-red-600">{errors.note.message}</p>}
      </div>

      {formError && (
        <Alert data-testid="time-entry-error" variant="danger">
          {formError}
        </Alert>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {initialEntry && (
          <Button type="button" variant="ghost" onClick={onCancelEdit} data-testid="time-entry-cancel">
            Cancel edit
          </Button>
        )}
        <Button
          type="submit"
          loading={isSubmitting}
          className="ml-auto"
          data-testid="time-entry-submit"
        >
          {initialEntry ? "Save changes" : "Submit time"}
        </Button>
      </div>
    </form>
  );
}

