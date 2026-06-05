import { getSessionUser } from "@/lib/firebase/auth";
import { redirect } from "next/navigation";
import { AppDrawer } from "@/components/shared/AppDrawer";
import { BottomBar } from "@/components/shared/BottomBar";
import { getBalance } from "@/lib/credits/ledger";
import { PageTransition } from "@/components/shared/PageTransition";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const credits = await getBalance(user.uid);

  return (
    <div className="grain relative flex min-h-screen bg-[hsl(var(--paper))] text-[hsl(var(--ink))]">
      <AppDrawer user={user} credits={credits} />
      <div className="flex min-w-0 flex-1 flex-col pb-28 lg:pb-0">
        <PageTransition>{children}</PageTransition>
      </div>
      <BottomBar />
    </div>
  );
}
