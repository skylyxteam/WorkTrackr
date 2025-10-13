import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth";
import { combineDateAndTimeToUtc } from "@/utils/date";
import {
  createTimeEntryRecord,
  listEntriesForAdmin,
  listEntriesForUser,
} from "@/services/timeEntries";
import { timeEntryPayloadSchema, exportQuerySchema } from "@/lib/validation";
import type { TimeEntryFilter } from "@/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getCurrentUserProfile();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = exportQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const filter: TimeEntryFilter = {
    status: parsed.data.status,
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate,
    userId: parsed.data.userId,
  };

  if (user.role !== "admin") {
    const entries = await listEntriesForUser(user.id, filter);
    return NextResponse.json({ entries });
  }

  const entries = await listEntriesForAdmin(filter);
  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  const user = await getCurrentUserProfile();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = timeEntryPayloadSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const startUtc = combineDateAndTimeToUtc(parsed.data.date, parsed.data.startTime);
    const endUtc = combineDateAndTimeToUtc(parsed.data.date, parsed.data.endTime);

    const entry = await createTimeEntryRecord({
      userId: user.id,
      date: parsed.data.date,
      startUtc,
      endUtc,
      note: parsed.data.note,
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error("Failed to create time entry", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create entry" },
      { status: 400 },
    );
  }
}
