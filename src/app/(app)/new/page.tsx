import { getSessionUser } from "@/lib/firebase/auth";
import { getBalance } from "@/lib/credits/ledger";
import { NewArchitectureForm } from "@/components/architecture/NewArchitectureForm";
import { Badge } from "@/components/ui/badge";
import { Coins } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "New architecture" };

export default async function NewArchitecturePage() {
  const user = (await getSessionUser())!;
  const credits = await getBalance(user.uid);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 md:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Design a new system</h1>
          <p className="mt-1 text-muted-foreground">
            Describe what you want built. The architect handles the rest.
          </p>
        </div>
        <Link href="/pricing">
          <Badge variant="brand" className="gap-1.5 px-3 py-1.5">
            <Coins className="size-3.5" />
            {credits} {credits === 1 ? "credit" : "credits"}
          </Badge>
        </Link>
      </div>
      <NewArchitectureForm credits={credits} />
    </div>
  );
}
