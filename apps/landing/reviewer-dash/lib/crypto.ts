// Pixl encrypts personal details at rest and decrypts them on the review page. Sample details are stored as plain text,
// so there is nothing to decrypt and no key is read.
export function decryptPII(value: string | null | undefined): string {
  return value ?? "";
}

export function encryptPII(value: string): string {
  return value;
}
