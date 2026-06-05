import { getSessionUser } from "@/lib/firebase/auth";
import { redirect } from "next/navigation";
import { NavigationRail } from "@/components/shared/NavigationRail";
import { MobileTopBar } from "@/components/shared/MobileTopBar";
import { getBalance } from "@/lib/credits/ledger";
import { PageTransition } from "@/components/shared/PageTransition";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const credits = await getBalance(user.uid);

  return (
    <div className="flex min-h-screen bg-m3-surface text-m3-on-surface">
      <NavigationRail user={user} credits={credits} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar />
        <main className="flex-1">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
