import { randomBytes } from "crypto";

const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789"; // no look-alikes (0/o, 1/l)

/** Short, URL-friendly id. 10 chars ≈ 50 bits. Pay-link ids double as a text memo (max 28 bytes). */
export function shortId(length = 10): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}
