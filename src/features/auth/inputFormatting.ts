export const phoneCountries = [
  { name: 'United States', region: 'US', code: '1' },
  { name: 'Canada', region: 'CA', code: '1' },
  { name: 'United Kingdom', region: 'GB', code: '44' },
  { name: 'India', region: 'IN', code: '91' },
  { name: 'Australia', region: 'AU', code: '61' },
  { name: 'France', region: 'FR', code: '33' },
  { name: 'Germany', region: 'DE', code: '49' },
  { name: 'Mexico', region: 'MX', code: '52' },
  { name: 'Brazil', region: 'BR', code: '55' },
  { name: 'Japan', region: 'JP', code: '81' },
] as const;
export function formatBirthInput(input: string, previous = ''): string {
  let digits = input.replace(/\D/g, '').slice(0, 8);
  if (previous.endsWith('/') && input === previous.slice(0, -1)) digits = digits.slice(0, -1);
  if (digits.length >= 2 && (Number(digits.slice(0, 2)) < 1 || Number(digits.slice(0, 2)) > 12)) return previous;
  if (digits.length >= 4 && (Number(digits.slice(2, 4)) < 1 || Number(digits.slice(2, 4)) > 31)) return previous;
  return digits.slice(0, 2) + (digits.length >= 2 ? '/' : '') + digits.slice(2, 4) + (digits.length >= 4 ? '/' : '') + digits.slice(4);
}
export function phoneDigits(input: string, countryCode: string): string {
  let digits = input.replace(/\D/g, '');
  if (input.trim().startsWith('+') && digits.startsWith(countryCode)) digits = digits.slice(countryCode.length);
  if (countryCode === '1' && digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1);
  return digits.slice(0, countryCode === '1' || countryCode === '91' ? 10 : 15 - countryCode.length);
}
export function formatPhoneInput(digits: string, code: string): string {
  if (code === '1') return digits.length <= 3 ? digits : `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}${digits.length > 6 ? '-' + digits.slice(6) : ''}`;
  if (code === '91') return digits.slice(0, 5) + (digits.length > 5 ? ' ' + digits.slice(5) : '');
  return digits.match(/.{1,3}/g)?.join(' ') ?? '';
}
export function internationalPhone(digits: string, code: string): string {
  if (!digits) return '';
  if ((code === '1' || code === '91') && digits.length !== 10) throw Error('Enter a complete 10-digit phone number.');
  if (!/^[1-9]\d{0,2}$/.test(code)) throw Error('Select a valid country calling code.');
  if (!/^\d+$/.test(digits) || code.length + digits.length < 8 || code.length + digits.length > 15) throw Error('Enter a complete phone number.');
  return '+' + code + digits;
}
