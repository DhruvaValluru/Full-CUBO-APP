import { GoogleAuthProvider, getRedirectResult, signInWithPopup, signInWithRedirect } from 'firebase/auth';

import { auth } from '../../lib/firebaseAuth';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

function prefersRedirect() {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPad|iPhone|iPod|Mobile/i.test(navigator.userAgent)
    || (typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches === true);
}

export async function startGoogleSignIn() {
  if (prefersRedirect()) {
    await signInWithRedirect(auth, googleProvider);
    return;
  }
  await signInWithPopup(auth, googleProvider);
}

export async function finishGoogleRedirectSignIn() {
  await getRedirectResult(auth);
}
