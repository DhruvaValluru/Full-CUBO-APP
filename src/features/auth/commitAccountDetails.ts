import type { AccountDetails } from './accountDetails';

/** Confirm the server write before updating UI/cache; failed writes must never look saved. */
export async function commitAccountDetails(details: AccountDetails, actions: {
  persistCloud: (details: AccountDetails) => Promise<void>;
  cacheLocally: (details: AccountDetails) => Promise<void>;
  onSaved: (details: AccountDetails) => void;
}) {
  await actions.persistCloud(details);
  actions.onSaved(details);
  await actions.cacheLocally(details).catch(() => undefined);
}
