export type AccountDetails = {
  birthDate: string;
  phoneNumber: string;
  accountType: 'minor' | 'adult';
  ageVerification: 'self-declared';
  phoneVerification: 'unverified';
  guardianStatus: 'not-linked';
};
export function parseBirthDate(input: string, now = new Date()): { birthDate: string; age: number; accountType: 'minor' | 'adult' } {
  const match = input.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) throw Error('Enter your birth date as MM/DD/YYYY.');
  const month = Number(match[1]), day = Number(match[2]), year = Number(match[3]);
  const birth = new Date(year, month - 1, day);
  if (birth.getFullYear() !== year || birth.getMonth() !== month - 1 || birth.getDate() !== day || birth > now) throw Error('Enter a valid birth date.');
  const age = now.getFullYear() - year - (now.getMonth() < month - 1 || (now.getMonth() === month - 1 && now.getDate() < day) ? 1 : 0);
  if (age > 120) throw Error('Please check your birth year.');
  return { birthDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`, age, accountType: age < 18 ? 'minor' : 'adult' };
}
export function makeAccountDetails(birthInput: string, phoneInput: string): AccountDetails {
  const birth = parseBirthDate(birthInput);
  const phoneNumber = phoneInput.trim() ? phoneInput.replace(/[\s()-]/g, '') : '';
  if (phoneNumber && !/^\+[1-9]\d{7,14}$/.test(phoneNumber)) throw Error('Use a phone number with country code, such as +1 919 555 0123.');
  return { birthDate: birth.birthDate, phoneNumber, accountType: birth.accountType, ageVerification: 'self-declared', phoneVerification: 'unverified', guardianStatus: 'not-linked' };
}
