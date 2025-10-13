import { z } from "zod";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/u, "Date must be YYYY-MM-DD");
const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/u, "Time must be in 24h HH:mm format");
const noteField = z
  .string()
  .max(500)
  .optional()
  .transform((value) => (value && value.trim().length ? value.trim() : undefined));

export const timeEntryPayloadSchema = z.object({
  date: dateString,
  startTime: timeString,
  endTime: timeString,
  note: noteField,
});

export const timeEntryUpdateSchema = timeEntryPayloadSchema.partial().refine(
  (value) => value.date || value.startTime || value.endTime || value.note !== undefined,
  {
    message: "At least one field must be provided",
  },
);

export const adminDecisionSchema = z.object({
  entryIds: z.array(z.string()).min(1),
  status: z.enum(["approved", "rejected"]),
  reviewNote: noteField,
});

export const exportQuerySchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "all"]).optional(),
  startDate: dateString.optional(),
  endDate: dateString.optional(),
  userId: z.string().optional(),
});

export const clockOutPayloadSchema = z.object({
  note: noteField,
});

export type TimeEntryPayloadInput = z.infer<typeof timeEntryPayloadSchema>;
export type TimeEntryUpdateInput = z.infer<typeof timeEntryUpdateSchema>;
export type AdminDecisionInput = z.infer<typeof adminDecisionSchema>;
export type ExportQueryInput = z.infer<typeof exportQuerySchema>;
export type ClockOutPayloadInput = z.infer<typeof clockOutPayloadSchema>;
