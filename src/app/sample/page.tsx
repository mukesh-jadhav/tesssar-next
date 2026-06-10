import { getSessionUser } from "@/lib/firebase/auth";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { ReportCockpit } from "@/components/workspace/ReportCockpit";
import { SAMPLE_ARCHITECTURE } from "@/lib/samples/scribestack";
import { getBalance } from "@/lib/credits/ledger";

export const metadata = {
  title: "Sample report — a full Tessar architecture",
  description:
    "See exactly what Tessar produces: a complete, principal-grade cloud architecture for a sample product — components, diagrams, cost in INR, risks, and roadmap.",
  alternates: { canonical: "/sample" },
  openGraph: {
    title: "Sample report — a full Tessar architecture",
    description:
      "See exactly what Tessar produces: a complete, principal-grade cloud architecture — diagrams, cost in ₹, risks, and roadmap.",
    url: "/sample",
    type: "website",
  },
};

export default async function SamplePage() {
  const user = await getSessionUser();
  const credits = user ? await getBalance(user.uid) : undefined;
  return (
    <WorkspaceShell user={user} credits={credits} grain>
      <ReportCockpit arch={SAMPLE_ARCHITECTURE} showDownload={false} />
    </WorkspaceShell>
  );
}
