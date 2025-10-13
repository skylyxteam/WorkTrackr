import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUserProfile();

  if (!user) {
    redirect("/sign-in");
  }

  if (user.role === "admin") {
    redirect("/admin");
  }

  redirect("/dashboard");
}
