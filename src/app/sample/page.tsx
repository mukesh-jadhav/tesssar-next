import { getSessionUser } from "@/lib/firebase/auth";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { ReportCockpit } from "@/components/workspace/ReportCockpit";
import { SAMPLE_ARCHITECTURE } from "@/lib/samples/scribestack";
import { getBalance } from "@/lib/credits/ledger";

export const metadata = {
  title: "Sample report",
  description:
    "See what Tessar produces. A complete, principal-grade cloud architecture for a sample product.",
};

export default async function SamplePage() {
  const user = await getSessionUser();
  const credits = user ? await getBalance(user.uid) : undefined;
  return (
    <WorkspaceShell
      user={user}
      credits={credits}
      contextLabel="§ Sample"
      contextTitle={SAMPLE_ARCHITECTURE.meta.title}
    >
      <ReportCockpit arch={SAMPLE_ARCHITECTURE} showDownload={false} />
    </WorkspaceShell>
  );
}
