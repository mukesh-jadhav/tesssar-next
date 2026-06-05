import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container flex flex-col gap-6 py-12 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-3 text-sm text-muted-foreground">
            The AI principal architect for founders. Built on Google Cloud, designed for India.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-12 text-sm sm:grid-cols-3">
          <div>
            <div className="mb-3 font-medium">Product</div>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link href="/sample" className="hover:text-foreground">Sample report</Link></li>
              <li><Link href="/pricing" className="hover:text-foreground">Pricing</Link></li>
              <li><Link href="/new" className="hover:text-foreground">Start a build</Link></li>
            </ul>
          </div>
          <div>
            <div className="mb-3 font-medium">Company</div>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="mailto:hello@tessar.app" className="hover:text-foreground">Contact</a></li>
              <li><Link href="/legal/terms" className="hover:text-foreground">Terms</Link></li>
              <li><Link href="/legal/privacy" className="hover:text-foreground">Privacy</Link></li>
            </ul>
          </div>
          <div>
            <div className="mb-3 font-medium">Built with</div>
            <ul className="space-y-2 text-muted-foreground">
              <li>Vertex AI · Gemini 2.5 Pro</li>
              <li>Cloud Run · Firestore</li>
              <li>Razorpay</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t">
        <div className="container py-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Tessar. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
