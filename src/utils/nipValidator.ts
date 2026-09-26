/**
 * RaportFinansowy24 - Walidator i Formater Numeru Identyfikacji Podatkowej (NIP)
 * Zgodny z oficjalnym algorytmem Ministerstwa Finansów RP.
 */

export interface NipValidationResult {
  isValid: boolean;
  cleanNip: string;
  formattedNip: string;
  error?: string;
}

/**
 * Usuwa spacje i myślniki z numeru NIP
 */
export function cleanNip(nip: string | null | undefined): string {
  if (!nip) return '';
  return String(nip).replace(/[\s-]/g, '').trim();
}

/**
 * Formatuje NIP do standardowego widoku: XXX-XXX-XX-XX
 * Obsługuje także częściowe wprowadzanie danych w polu tekstowym.
 */
export function formatNip(nip: string | null | undefined): string {
  const clean = cleanNip(nip);
  if (!clean) return '';
  
  // Zachowaj tylko cyfry dla celów formatowania
  const digits = clean.replace(/\D/g, '').slice(0, 10);
  
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length <= 8) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
}

/**
 * Główna funkcja walidująca NIP:
 * 1. Usuwa spacje i myślniki
 * 2. Sprawdza czy ciąg składa się z dokładnie 10 cyfr
 * 3. Oblicza oficjalną sumę kontrolną z wagami [6, 5, 7, 2, 3, 4, 5, 6, 7]
 * 4. Weryfikuje: suma % 11 === d10 (jeśli suma % 11 === 10, NIP jest nieprawidłowy)
 */
export function validateNip(nip: string | null | undefined): NipValidationResult {
  const clean = cleanNip(nip);

  // Przypadek pustego pola
  if (!clean) {
    return {
      isValid: false,
      cleanNip: '',
      formattedNip: '',
      error: 'Wpisz numer NIP'
    };
  }

  // Sprawdzenie czy występują wyłącznie cyfry
  if (!/^\d+$/.test(clean)) {
    return {
      isValid: false,
      cleanNip: clean,
      formattedNip: clean,
      error: 'NIP może zawierać wyłącznie cyfry'
    };
  }

  // Sprawdzenie długości (dokładnie 10 cyfr)
  if (clean.length !== 10) {
    return {
      isValid: false,
      cleanNip: clean,
      formattedNip: formatNip(clean),
      error: 'NIP musi składać się z dokładnie 10 cyfr'
    };
  }

  // Algorytm sumy kontrolnej
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  const digits = clean.split('').map(Number);

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * weights[i];
  }

  const checksum = sum % 11;
  const controlDigit = digits[9];

  // Cyfra kontrolna nie może wynosić 10 (taki NIP jest z definicji nieprawidłowy)
  if (checksum === 10 || checksum !== controlDigit) {
    return {
      isValid: false,
      cleanNip: clean,
      formattedNip: formatNip(clean),
      error: 'Nieprawidłowy NIP'
    };
  }

  return {
    isValid: true,
    cleanNip: clean,
    formattedNip: formatNip(clean)
  };
}

/**
 * Pomocnicza funkcja logiczna zwracająca boolean
 */
export function isValidNip(nip: string | null | undefined): boolean {
  return validateNip(nip).isValid;
}
