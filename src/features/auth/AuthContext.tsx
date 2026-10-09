import { createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut as firebaseSignOut, updateProfile, type User } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { db } from '../../lib/firebase';
import { auth } from '../../lib/firebaseAuth';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, (nextUser) => { setUser(nextUser); setLoading(false); }), []);

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    await updateProfile(credential.user, { displayName: cleanName });
    await setDoc(doc(db, 'users', credential.user.uid), {
      uid: credential.user.uid,
      name: cleanName,
      email: cleanEmail,
      theme: 'dark',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim().toLowerCase());
  }, []);
  const signOut = useCallback(() => firebaseSignOut(auth), []);
  const value = useMemo(() => ({ user, loading, signIn, signUp, resetPassword, signOut }), [loading, resetPassword, signIn, signOut, signUp, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
