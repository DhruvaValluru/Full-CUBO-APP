import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

import { auth } from '../../lib/firebaseAuth';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function startGoogleSignIn() {
  // CUBO is hosted by Cloudflare rather than Firebase Hosting. Firebase's
  // redirect helper loses its cross-origin storage on modern Safari and other
  // privacy-focused browsers, returning users to the signed-out welcome page.
  // A user-initiated popup keeps the Firebase session on CUBO's own origin.
  await signInWithPopup(auth, googleProvider);
}
