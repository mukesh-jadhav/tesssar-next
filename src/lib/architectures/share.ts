import "server-only";

import { randomBytes } from "node:crypto";

// URL-safe, unambiguous alphabet (no 0/O/1/l/I). 11 chars ≈ 64 bits of entropy
// — plenty for an unguessable share slug, short enough to look pretty in a URL.
const ALPHABET =
  "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
const SLUG_LEN = 11;

const SLUG_PATTERN = new RegExp(`^[${ALPHABET}]{${SLUG_LEN}}$`);

export function newShareSlug(): string {
  const bytes = randomBytes(SLUG_LEN);
  let out = "";
  for (let i = 0; i < SLUG_LEN; i++) {
    out += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return out;
}

/** Strict structural check — keeps malformed slugs from hitting Firestore. */
export function isValidShareSlug(slug: string | undefined | null): slug is string {
  return typeof slug === "string" && SLUG_PATTERN.test(slug);
}

/** Cost to mint a public share link for a report. */
export const SHARE_COST_CREDITS = 2;
