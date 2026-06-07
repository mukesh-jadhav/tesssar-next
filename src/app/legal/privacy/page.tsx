export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="container max-w-2xl py-16 prose dark:prose-invert">
      <h1>Privacy Policy</h1>
      <p>We respect your privacy. Tessar stores: your Google account profile, the briefs you submit, the architectures we generate, and your purchase history.</p>
      <h2>Data Residency</h2>
      <p>User and architecture data is stored in Google Cloud Firestore in the <code>asia-south1</code> region by default.</p>
      <h2>Third Parties</h2>
      <p>We use Google Cloud&rsquo;s managed AI services for generation, Razorpay for payments, and Resend for receipts. We do not sell your data to anyone.</p>
      <h2>Your Rights (DPDP 2023)</h2>
      <p>You may request export or deletion of your data at any time by emailing hello@tessar.dev.</p>
    </div>
  );
}
