export function normalizePhoneNumber(rawValue: string) {
  // Strip spaces, dashes, parentheses, dots
  let cleaned = rawValue.trim().replace(/[\s\-\(\)\.]+/g, "");

  // If starts with +251
  if (cleaned.startsWith("+251")) {
    cleaned = "0" + cleaned.slice(4);
  } else if (cleaned.startsWith("251")) {
    cleaned = "0" + cleaned.slice(3);
  }

  // If user entered 9 digits starting with 9 or 7 (e.g. 911234567 or 712345678)
  if (/^[97]\d{8}$/.test(cleaned)) {
    cleaned = "0" + cleaned;
  }

  // Ethio Telecom (09) or Safaricom Ethiopia (07)
  if (/^0[97]\d{8}$/.test(cleaned)) {
    return cleaned;
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
