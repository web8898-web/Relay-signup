import crypto from "crypto";

// Avoid visually ambiguous characters (0/O, 1/l/I) so codes are easy to
// read and retype if someone has to copy them by hand.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function generateShortCode(length = 6) {
  const bytes = crypto.randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}
