import { redirect } from "next/navigation";

export const metadata = { title: "Studio" };

// `/studio` was a duplicate of `/new` (the same single-brief composer). It now
// permanently redirects to `/new`, the canonical composer, so any old
// bookmarks or external links keep working.
export default function StudioPage() {
  redirect("/new");
}
