import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth";
import { combineDateAndTimeToUtc } from "@/utils/date";
import { timeEntryPayloadSchema } from "@/lib/validation";
import { deleteTimeEntryRecord, updateTimeEntryRecord } from "@/services/timeEntries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteParams = Promise<{ entryId: string }>;

export async function PATCH(
  request: Request,
  { params }: { params: RouteParams },
) {
  const { entryId } = await params;
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
    // Prefer pre-converted UTC from client (to avoid server timezone issues)
    // Fall back to server-side conversion for backward compatibility
    const startUtc = parsed.data.startUtc ?? combineDateAndTimeToUtc(parsed.data.date, parsed.data.startTime);
    const endUtc = parsed.data.endUtc ?? combineDateAndTimeToUtc(parsed.data.date, parsed.data.endTime);

    const entry = await updateTimeEntryRecord({
      entryId,
      userId: user.id,
      date: parsed.data.date,
      startUtc,
      endUtc,
      note: parsed.data.note,
      actingRole: user.role,
    });

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Failed to update time entry", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update entry" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: RouteParams },
) {
  const { entryId } = await params;
  const user = await getCurrentUserProfile();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await deleteTimeEntryRecord(entryId, user.id, user.role);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete time entry", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete entry" },
      { status: 400 },
    );
  }
}
