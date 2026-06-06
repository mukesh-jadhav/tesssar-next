import { getSessionUser } from "@/lib/firebase/auth";
import { getBalance } from "@/lib/credits/ledger";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { HomeCockpit } from "@/components/workspace/HomeCockpit";

export const metadata = { title: "Studio" };

export default async function StudioPage() {
  const user = await getSessionUser();
  const credits = user ? await getBalance(user.uid) : undefined;
  return (
    <WorkspaceShell user={user} credits={credits}>
      <HomeCockpit signedIn={!!user} credits={credits} user={user} />
    </WorkspaceShell>
  );
}
