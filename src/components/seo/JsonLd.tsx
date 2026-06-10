/**
 * Renders a JSON-LD structured-data block. The payload is our own
 * trusted, server-built data (never user input), so the dangerouslySet
 * is safe here. Use one <JsonLd> per schema object.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
