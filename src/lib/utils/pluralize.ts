/**
 * Funkcja do poprawnej odmiany polskich liczebników
 * 
 * @param count - liczba
 * @param singular - forma pojedyncza (np. "dzień", "miesiąc")
 * @param plural - forma mnoga 2-4 (np. "dni", "miesiące")
 * @param pluralMany - forma mnoga 5+ (np. "dni", "miesięcy")
 * @returns poprawnie odmienione słowo
 */
export function pluralize(count: number, singular: string, plural: string, pluralMany: string): string {
  const absCount = Math.abs(count);
  
  // Dla 1
  if (absCount === 1) {
    return singular;
  }
  
  // Dla liczb kończących się na 2, 3, 4 (ale nie 12, 13, 14)
  const lastDigit = absCount % 10;
  const lastTwoDigits = absCount % 100;
  
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)) {
    return plural;
  }
  
  // Dla pozostałych (0, 5-9, 11-14, etc.)
  return pluralMany;
}

/**
 * Odmiana słowa "dzień"
 */
export function pluralizeDays(count: number): string {
  return pluralize(count, 'dzień', 'dni', 'dni');
}

/**
 * Odmiana słowa "miesiąc"
 */
export function pluralizeMonths(count: number): string {
  return pluralize(count, 'miesiąc', 'miesiące', 'miesięcy');
}

