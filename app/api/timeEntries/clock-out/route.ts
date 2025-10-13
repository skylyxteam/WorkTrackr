import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth";
import { clockOutPayloadSchema } from "@/lib/validation";
import { completeTimeEntryRecord } from "@/services/timeEntries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUserProfile();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request
    .json()
    .catch(() => ({}));
  const parsed = clockOutPayloadSchema.safeParse(json ?? {});

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const entry = await completeTimeEntryRecord({
      userId: user.id,
      note: parsed.data.note,
    });

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Failed to clock out", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to clock out" },
      { status: 400 },
    );
  }
}
