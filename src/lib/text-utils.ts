/**
 * Strips combining diacritical marks from a string.
 * Normalizes to NFD (decomposed form) then removes accent marks.
 *
 * @example normalizeAccents('Château') // 'Chateau'
 * @example normalizeAccents('España') // 'Espana'
 */
export function normalizeAccents(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Case- and accent-insensitive substring match.
 * Returns true if `needle` appears anywhere inside `haystack`,
 * ignoring case and diacritical marks.
 */
export function accentInsensitiveIncludes(
  haystack: string,
  needle: string,
): boolean {
  return normalizeAccents(haystack)
    .toLowerCase()
    .includes(normalizeAccents(needle).toLowerCase());
}

/**
 * Case- and accent-insensitive exact equality.
 * Returns true if both strings are equal after normalizing accents and case.
 */
export function accentInsensitiveEquals(a: string, b: string): boolean {
  return (
    normalizeAccents(a).toLowerCase() === normalizeAccents(b).toLowerCase()
  );
}
