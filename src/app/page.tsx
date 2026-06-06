import { getSessionUser } from "@/lib/firebase/auth";
import { getBalance } from "@/lib/credits/ledger";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { HomeCockpit } from "@/components/workspace/HomeCockpit";

export default async function HomePage() {
  const user = await getSessionUser();
  const credits = user ? await getBalance(user.uid) : undefined;
  return (
    <WorkspaceShell
      user={user}
      credits={credits}
      contextLabel="§ Tessar"
      contextTitle={user ? `Welcome, ${user.displayName?.split(" ")[0] ?? user.email.split("@")[0]}` : "Cloud architecture, written in minutes"}
    >
      <HomeCockpit signedIn={!!user} credits={credits} />
    </WorkspaceShell>
  );
}
