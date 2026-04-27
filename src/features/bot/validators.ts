export function normalizePhoneNumber(rawValue: string) {
  const trimmed = rawValue.trim().replace(/\s+/g, "");

  if (/^09\d{8}$/.test(trimmed)) {
    return trimmed;
  }

  if (/^\+2519\d{8}$/.test(trimmed)) {
    return trimmed;
  }

  if (/^2519\d{8}$/.test(trimmed)) {
    return `+${trimmed}`;
  }

  return null;
}

export function validatePinPassword(rawValue: string) {
  const trimmed = rawValue.trim();

  if (!/^\d{4,}$/.test(trimmed)) {
    return null;
  }

  return trimmed;
}
