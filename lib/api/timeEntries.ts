"use client";

import type { TimeEntry, TimeEntryWithUser } from "@/types";
import type {
  TimeEntryPayloadInput,
  AdminDecisionInput,
  ExportQueryInput,
  ClockOutPayloadInput,
} from "@/lib/validation";
import { combineDateAndTimeToUtc } from "@/utils/date";

async function handleJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Request failed");
  }
  return (await response.json()) as T;
}

export async function clockIn(): Promise<TimeEntry> {
  const response = await fetch("/api/timeEntries/clock-in", {
    method: "POST",
  });

  const data = await handleJson<{ entry: TimeEntry }>(response);
  return data.entry;
}

export async function clockOut(payload: ClockOutPayloadInput = { note: undefined }): Promise<TimeEntry> {
  const response = await fetch("/api/timeEntries/clock-out", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await handleJson<{ entry: TimeEntry }>(response);
  return data.entry;
}

export async function createTimeEntry(payload: TimeEntryPayloadInput): Promise<TimeEntry> {
  // Convert to UTC on the client side to avoid server timezone issues
  const startUtc = combineDateAndTimeToUtc(payload.date, payload.startTime);
  const endUtc = combineDateAndTimeToUtc(payload.date, payload.endTime);

  const response = await fetch("/api/timeEntries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      startUtc,
      endUtc,
    }),
  });

  const data = await handleJson<{ entry: TimeEntry }>(response);
  return data.entry;
}

export async function updateTimeEntry(id: string, payload: TimeEntryPayloadInput): Promise<TimeEntry> {
  // Convert to UTC on the client side to avoid server timezone issues
  const startUtc = combineDateAndTimeToUtc(payload.date, payload.startTime);
  const endUtc = combineDateAndTimeToUtc(payload.date, payload.endTime);

  const response = await fetch(`/api/timeEntries/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      startUtc,
      endUtc,
    }),
  });

  const data = await handleJson<{ entry: TimeEntry }>(response);
  return data.entry;
}

export async function deleteTimeEntry(id: string): Promise<void> {
  const response = await fetch(`/api/timeEntries/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Request failed");
  }
}

export async function fetchTimeEntries(params: Partial<ExportQueryInput> = {}): Promise<TimeEntry[] | TimeEntryWithUser[]> {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, String(value));
  });

  const response = await fetch(`/api/timeEntries${search.size ? `?${search.toString()}` : ""}`);
  const data = await handleJson<{ entries: (TimeEntry | TimeEntryWithUser)[] }>(response);
  return data.entries;
}

export async function bulkApproveEntries(payload: AdminDecisionInput): Promise<void> {
  const response = await fetch("/api/admin/approve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Request failed");
  }
}

export async function downloadCsv(params: Partial<ExportQueryInput> = {}): Promise<void> {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, String(value));
  });

  const response = await fetch(`/api/admin/export${search.size ? `?${search.toString()}` : ""}`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Unable to export data");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `clockup-export-${new Date().toISOString().slice(0, 10)}.csv`;  anchor.click();
  URL.revokeObjectURL(url);
}
