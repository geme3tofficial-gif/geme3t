import {
  getCountries,
  getCountryCallingCode,
  isSupportedCountry,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

function countryFlag(countryCode: CountryCode) {
  return String.fromCodePoint(
    ...countryCode
      .split("")
      .map((character) => character.charCodeAt(0) + 127397),
  );
}

export const phoneCountries = getCountries()
  .map((countryCode) => ({
    countryCode,
    callingCode: getCountryCallingCode(countryCode),
    name: countryNames.of(countryCode) ?? countryCode,
    flag: countryFlag(countryCode),
  }))
  .sort((left, right) => {
    if (left.countryCode === "NG") return -1;
    if (right.countryCode === "NG") return 1;
    return left.name.localeCompare(right.name);
  });

export function normalizeWhatsAppNumber(
  input: string,
  countryCode: string,
): string | null {
  const compact = input.trim().replace(/[\s().-]/g, "");
  const normalizedCountryCode = countryCode.toUpperCase();
  if (!compact || !isSupportedCountry(normalizedCountryCode)) return null;

  const parsed = parsePhoneNumberFromString(
    compact,
    normalizedCountryCode,
  );

  return parsed?.isValid() ? parsed.number : null;
}
