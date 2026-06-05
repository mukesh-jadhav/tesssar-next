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
    <div className="relative flex min-h-screen bg-m3-surface text-m3-on-surface">
      <AppDrawer user={user} credits={credits} />
      <div className="flex min-w-0 flex-1 flex-col pb-24 lg:pb-0">
        <PageTransition>{children}</PageTransition>
      </div>
      <BottomBar />
    </div>
  );
}
