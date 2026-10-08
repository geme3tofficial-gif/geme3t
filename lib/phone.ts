const callingCodes: Record<string, string> = {
  Nigeria: "234",
  UK: "44",
  "United States": "1",
  Ghana: "233",
  Kenya: "254",
  Canada: "1",
};

export function normalizeWhatsAppNumber(
  input: string,
  country: string,
): string | null {
  const compact = input.trim().replace(/[\s().-]/g, "");

  if (/^\+\d{7,15}$/.test(compact)) return compact;
  if (/^00\d{7,15}$/.test(compact)) return `+${compact.slice(2)}`;
  if (!/^\d+$/.test(compact)) return null;

  const callingCode = callingCodes[country];
  if (!callingCode) return null;

  const nationalNumber = compact.startsWith("0")
    ? compact.slice(1)
    : compact;
  const internationalNumber = `${callingCode}${nationalNumber}`;

  if (internationalNumber.length < 7 || internationalNumber.length > 15) {
    return null;
  }

  return `+${internationalNumber}`;
}
