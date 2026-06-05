import { getSessionUser } from "@/lib/firebase/auth";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/shared/AppHeader";
import { Footer } from "@/components/shared/Footer";
import { getBalance } from "@/lib/credits/ledger";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const credits = await getBalance(user.uid);

  return (
    <div className="flex min-h-screen flex-col bg-secondary/30">
      <AppHeader user={user} credits={credits} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
