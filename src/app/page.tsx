import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import Dashboard from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <Dashboard
      user={{
        id: user.id,
        name: user.name,
        onboardingComplete: user.onboardingComplete,
      }}
    />
  );
}
