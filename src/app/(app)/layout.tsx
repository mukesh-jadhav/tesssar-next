import { getSessionUser } from "@/lib/firebase/auth";
import { redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { getBalance } from "@/lib/credits/ledger";

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
