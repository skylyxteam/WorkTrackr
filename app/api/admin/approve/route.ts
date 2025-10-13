import { NextResponse } from "next/server";
import { getCurrentUserProfile, assertAdmin } from "@/lib/auth";
import { adminDecisionSchema } from "@/lib/validation";
import { setEntryStatus } from "@/services/timeEntries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUserProfile();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    assertAdmin(user);
  } catch {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const json = await request.json();
  const parsed = adminDecisionSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    await setEntryStatus(parsed.data.entryIds, parsed.data.status, {
      reviewerId: user.id,
      reviewNote: parsed.data.reviewNote,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update entries", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update entries" },
      { status: 400 },
    );
  }
}
