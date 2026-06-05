import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container flex flex-col gap-8 py-14 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            The AI principal architect for founders. Built on Google Cloud, designed for India.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-12 text-sm sm:grid-cols-3">
          <FooterCol
            title="Product"
            links={[
              { href: "/sample", label: "Sample report" },
              { href: "/pricing", label: "Pricing" },
              { href: "/new", label: "Start a build" },
            ]}
          />
          <FooterCol
            title="Company"
            links={[
              { href: "mailto:hello@tessar.app", label: "Contact" },
              { href: "/legal/terms", label: "Terms" },
              { href: "/legal/privacy", label: "Privacy" },
            ]}
          />
          <div>
            <div className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Built with
            </div>
            <ul className="space-y-2 text-muted-foreground">
              <li>Vertex AI · Gemini 2.5 Pro</li>
              <li>Cloud Run · Firestore</li>
              <li>Razorpay</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t">
        <div className="container py-5 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Tessar. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <div className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </div>
      <ul className="space-y-2 text-muted-foreground">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="transition-colors duration-200 hover:text-foreground"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
