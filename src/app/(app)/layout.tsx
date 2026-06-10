import { getSessionUser } from "@/lib/firebase/auth";
import { redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { getBalance } from "@/lib/credits/ledger";

// The authenticated app surface is private — keep it out of the index.
export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const credits = await getBalance(user.uid);

  return (
    <WorkspaceShell user={user} credits={credits}>
      {children}
    </WorkspaceShell>
  );
}
