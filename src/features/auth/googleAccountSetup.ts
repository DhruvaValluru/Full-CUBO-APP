import type { AccountDetails } from './accountDetails';

function hasCompleteAccountDetails(value: unknown): value is AccountDetails {
  if (!value || typeof value !== 'object') return false;
  const details = value as Partial<AccountDetails>;
  return typeof details.birthDate === 'string' && details.birthDate.length === 10
    && typeof details.phoneNumber === 'string' && details.phoneNumber.startsWith('+');
}

/** Email/password accounts keep their existing flow; only incomplete Google accounts are gated. */
export function googleAccountNeedsSetup(providerIds: string[], accountDetails: unknown) {
  return providerIds.includes('google.com') && !hasCompleteAccountDetails(accountDetails);
}
