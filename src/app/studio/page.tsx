import { getSessionUser } from "@/lib/firebase/auth";
import { getBalance } from "@/lib/credits/ledger";
import { getUserRunCount } from "@/lib/architectures/stats";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { HomeCockpit } from "@/components/workspace/HomeCockpit";

export const metadata = { title: "Studio" };

export default async function StudioPage() {
  const user = await getSessionUser();
  const [credits, runCount] = user
    ? await Promise.all([getBalance(user.uid), getUserRunCount(user.uid)])
    : [undefined, 0];
  return (
    <WorkspaceShell user={user} credits={credits}>
      <HomeCockpit signedIn={!!user} credits={credits} user={user} runCount={runCount} />
    </WorkspaceShell>
  );
}
