import { GoogleAuthProvider, linkWithPopup } from 'firebase/auth';

import { auth } from '../../lib/firebaseAuth';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function linkCurrentUserWithGoogle() {
  const current = auth.currentUser;
  if (!current) throw Error('Sign in before linking Google.');
  if (current.providerData.some(provider => provider.providerId === GoogleAuthProvider.PROVIDER_ID)) return;
  await linkWithPopup(current, googleProvider);
}
