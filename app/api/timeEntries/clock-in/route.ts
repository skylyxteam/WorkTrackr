import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth";
import { startTimeEntryRecord } from "@/services/timeEntries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const user = await getCurrentUserProfile();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const entry = await startTimeEntryRecord({ userId: user.id });
    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error("Failed to clock in", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to clock in" },
      { status: 400 },
    );
  }
}
