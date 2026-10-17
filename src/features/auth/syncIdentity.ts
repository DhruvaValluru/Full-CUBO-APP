import { getIdToken, reload, type User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth } from '../../lib/firebaseAuth';
import { db } from '../../lib/firebase';

export async function syncIdentity(user: User) {
  await reload(user);
  await getIdToken(user, true);
  if (auth.currentUser?.uid !== user.uid) throw Error('Your account changed. Please try again.');
  const reference = doc(db, 'users', user.uid);
  const snapshot = await getDoc(reference);
  if (snapshot.exists() && user.email && snapshot.data().email !== user.email) {
    if (!user.emailVerified) throw Error('Verify your new email address before saving account changes.');
    await updateDoc(reference, { email: user.email, updatedAt: serverTimestamp() });
  }
}
