export function normalizePhoneNumber(input: string): string {
  const phone = input.replace(/[\s()-]/g, "");
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
    throw new Error("Phone must be in E.164 format");
  }

  return phone;
}
