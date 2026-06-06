export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="container max-w-2xl py-16 prose dark:prose-invert">
      <h1>Terms of Service</h1>
      <p>By using Tessar you agree to these terms. Tessar generates architecture suggestions for informational purposes; you remain responsible for engineering decisions you ship.</p>
      <h2>Credits</h2>
      <p>Credits are non-refundable except when the agent fails to produce a valid architecture (in which case the credits for that run are automatically returned). Credits do not expire.</p>
      <h2>Acceptable Use</h2>
      <p>Don't use the service to generate content that violates Indian law or another party's rights.</p>
      <h2>Limitation of Liability</h2>
      <p>Tessar is provided "as is". Maximum liability is limited to the amount you paid in the trailing 90 days.</p>
      <h2>Contact</h2>
      <p>hello@tessar.app</p>
    </div>
  );
}
