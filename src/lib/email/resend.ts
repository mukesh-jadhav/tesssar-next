import "server-only";

import { Resend } from "resend";

let cached: Resend | null = null;
function client() {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY missing");
  cached = new Resend(key);
  return cached;
}

const FROM = process.env.RESEND_FROM_EMAIL || "Tessar <receipts@tessar.app>";

export async function sendReceiptEmail(args: {
  to: string;
  displayName: string | null;
  packName: string;
  credits: number;
  amountPaise: number;
  paymentId: string;
  invoiceUrl?: string;
}) {
  const amount = (args.amountPaise / 100).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
  });

  const html = `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;color:#0a0a0a;">
    <div style="padding:32px 0;border-bottom:1px solid #e5e5e5;">
      <h1 style="margin:0;font-size:24px;letter-spacing:-0.02em;">Tessar</h1>
      <p style="margin:4px 0 0;color:#737373;font-size:14px;">Architecture credits — receipt</p>
    </div>
    <div style="padding:24px 0;">
      <p>Hi ${escapeHtml(args.displayName ?? "there")},</p>
      <p>Thanks for the purchase. Your credits are live in your account.</p>
      <table style="width:100%;border-collapse:collapse;margin:24px 0;">
        <tr><td style="padding:8px 0;color:#737373;">Pack</td><td style="padding:8px 0;text-align:right;font-weight:600;">${escapeHtml(args.packName)}</td></tr>
        <tr><td style="padding:8px 0;color:#737373;">Credits added</td><td style="padding:8px 0;text-align:right;font-weight:600;">${args.credits}</td></tr>
        <tr><td style="padding:8px 0;color:#737373;">Amount paid</td><td style="padding:8px 0;text-align:right;font-weight:600;">${amount}</td></tr>
        <tr><td style="padding:8px 0;color:#737373;">Payment ID</td><td style="padding:8px 0;text-align:right;font-family:monospace;font-size:12px;">${escapeHtml(args.paymentId)}</td></tr>
      </table>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://tessar.app"}/new"
         style="display:inline-block;background:#0a0a0a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">
        Start a new architecture →
      </a>
    </div>
    <div style="padding:24px 0;border-top:1px solid #e5e5e5;color:#737373;font-size:12px;">
      Tessar · AI cloud architect · Built on Google Cloud
    </div>
  </div>`;

  await client().emails.send({
    from: FROM,
    to: args.to,
    subject: `Receipt — ${args.credits} Tessar credits added`,
    html,
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}
