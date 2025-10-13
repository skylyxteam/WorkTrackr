import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/auth";
import { listEntriesForAdmin } from "@/services/timeEntries";
import { listUsers } from "@/services/users";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export default async function AdminPage() {
  const user = await getCurrentUserProfile();

  if (!user) {
    redirect("/sign-in");
  }

  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  const [entries, employees] = await Promise.all([
    listEntriesForAdmin({ status: "pending" }),
    listUsers("employee"),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Team approvals</h1>
        <p className="text-sm text-[rgb(var(--color-subtle))]">
          Filter submissions, approve in bulk, and export records for payroll.
        </p>
      </header>
      <AdminDashboard initialEntries={entries} employees={employees} />
    </div>
  );
}
