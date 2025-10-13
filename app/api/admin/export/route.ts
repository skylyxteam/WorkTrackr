import { NextResponse } from "next/server";
import { getCurrentUserProfile, assertAdmin } from "@/lib/auth";
import { exportQuerySchema } from "@/lib/validation";
import { exportEntries } from "@/services/timeEntries";
import { timeEntriesToCsv } from "@/utils/csv";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getCurrentUserProfile();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    assertAdmin(user);
  } catch {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = exportQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const entries = await exportEntries({
    status: parsed.data.status,
    userId: parsed.data.userId,
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate,
  });

  const csv = timeEntriesToCsv(entries);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="worktrackr-export-${Date.now()}.csv"`,
    },
  });
}
