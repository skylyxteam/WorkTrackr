import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/auth";
import { getTotalMinutesForUser } from "@/services/timeEntries";
import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { formatIsoToLocalDateTime, formatMinutesToHoursAndMinutes } from "@/utils/date";

export default async function ProfilePage() {
  const user = await getCurrentUserProfile();

  if (!user) {
    redirect("/sign-in");
  }

  const totalMinutes = await getTotalMinutesForUser(user.id);
  const totalHoursLabel = formatMinutesToHoursAndMinutes(totalMinutes);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Profile</h1>
        <p className="text-sm text-[rgb(var(--color-subtle))]">
          Manage your ClockUp account details.
        </p>
      </header>

      <section className="space-y-4 rounded-2xl border border-[rgb(var(--color-border))] bg-white p-6 shadow-sm dark:bg-[rgb(var(--color-surface))]">
        <div className="space-y-2">
          <p className="text-sm font-medium text-[rgb(var(--color-subtle))]">Display name</p>
          <p className="text-lg font-semibold">{user.displayName}</p>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-[rgb(var(--color-subtle))]">Email</p>
          <p className="text-lg font-semibold">{user.email}</p>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-[rgb(var(--color-subtle))]">Role</p>
          <Badge variant={user.role === "admin" ? "success" : "info"}>{user.role}</Badge>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-[rgb(var(--color-subtle))]">Total hours</p>
          <p className="text-lg font-semibold">{totalHoursLabel}</p>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-[rgb(var(--color-subtle))]">Member since</p>
          <p>{formatIsoToLocalDateTime(user.createdAt)}</p>
        </div>
        <div className="pt-4">
          <SignOutButton />
        </div>
      </section>
    </div>
  );
}
