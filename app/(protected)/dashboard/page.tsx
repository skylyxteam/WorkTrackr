import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/auth";
import { listEntriesForUser } from "@/services/timeEntries";
import { EmployeeDashboard } from "@/components/dashboard/employee-dashboard";

export default async function DashboardPage() {
  const user = await getCurrentUserProfile();

  if (!user) {
    redirect("/sign-in");
  }

  const entries = await listEntriesForUser(user.id);

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold text-[rgb(var(--color-foreground))]">
          Welcome back, {user.displayName.split(" ")[0] || user.displayName}
        </h1>
        <p className="text-sm text-[rgb(var(--color-subtle))]">
          Submit your hours, keep notes, and check on approvals in one place.
        </p>
      </header>
      <EmployeeDashboard initialEntries={entries} />
    </div>
  );
}
