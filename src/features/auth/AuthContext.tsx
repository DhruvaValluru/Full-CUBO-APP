import { createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut as firebaseSignOut, updateProfile, EmailAuthProvider, reauthenticateWithCredential, verifyBeforeUpdateEmail, updatePassword, type User } from 'firebase/auth';
import { doc, serverTimestamp, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeAccountDetails, type AccountDetails } from './accountDetails';
import { commitAccountDetails } from './commitAccountDetails';
import { db } from '../../lib/firebase';
import { auth } from '../../lib/firebaseAuth';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  accountDetails: AccountDetails | null;
  saveAccountDetails: (details: AccountDetails) => Promise<void>;
  changeEmail: (email: string, currentPassword: string) => Promise<void>;
  changePassword: (password: string, currentPassword: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, details: AccountDetails) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null);
  const [provisioning, setProvisioning] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, (nextUser) => { setUser(nextUser); setLoading(false); }), []);

  useEffect(() => {
    let active = true; let cloudSeen = false; setAccountDetails(null);
    if (!user) return;
    const key = `cubo-account-details:${user.uid}`;
    const parse = (raw: unknown) => {
      try {
        const value = raw as AccountDetails;
        if (!value?.birthDate || !value.phoneNumber) return null;
        const [year, month, day] = value.birthDate.split('-');
        return makeAccountDetails(`${month}/${day}/${year}`, value.phoneNumber);
      } catch { return null; }
    };
    void AsyncStorage.getItem(key).then(raw => { if (active && !cloudSeen && raw) setAccountDetails(parse(JSON.parse(raw))); }).catch(() => undefined);
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), snapshot => {
      if (!active || auth.currentUser?.uid !== user.uid || snapshot.metadata.hasPendingWrites) return;
      cloudSeen = true;
      const details = parse(snapshot.data()?.accountDetails);
      if (details) { setAccountDetails(details); void AsyncStorage.setItem(key, JSON.stringify(details)).catch(() => undefined); }
    }, () => undefined);
    return () => { active = false; unsubscribe(); };
  }, [user?.uid]);
  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string, details: AccountDetails) => {
    setProvisioning(true);
    try {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    await AsyncStorage.setItem(`cubo-account-details:${credential.user.uid}`, JSON.stringify(details));
    setAccountDetails(details);
    await updateProfile(credential.user, { displayName: cleanName });
    await setDoc(doc(db, 'users', credential.user.uid), {
      uid: credential.user.uid,
      name: cleanName,
      email: cleanEmail,
      theme: 'light',
      accountDetails: details,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    } finally { setProvisioning(false); }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim().toLowerCase());
  }, []);
  const signOut = useCallback(() => firebaseSignOut(auth), []);
  const saveAccountDetails = useCallback(async (details: AccountDetails) => {
    const current = auth.currentUser;
    if (!current) throw Error('Sign in before changing account details.');
    const [year, month, day] = details.birthDate.split('-');
    const validated = makeAccountDetails(`${month}/${day}/${year}`, details.phoneNumber);
    await commitAccountDetails(validated, {
      persistCloud: value => updateDoc(doc(db, 'users', current.uid), { accountDetails: value, updatedAt: serverTimestamp() }),
      cacheLocally: value => AsyncStorage.setItem(`cubo-account-details:${current.uid}`, JSON.stringify(value)),
      onSaved: value => { if (auth.currentUser?.uid === current.uid) setAccountDetails(value); },
    });
  }, []);
  const reauthenticate = async (password: string) => {
    const current = auth.currentUser;
    if (!current?.email) throw Error('Sign in again before changing security settings.');
    if (!password) throw Error('Enter your current password to confirm this change.');
    await reauthenticateWithCredential(current, EmailAuthProvider.credential(current.email, password));
    return current;
  };
  const changeEmail = useCallback(async (email: string, currentPassword: string) => {
    const clean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) throw Error('Enter a valid new email address.');
    const current = await reauthenticate(currentPassword);
    await verifyBeforeUpdateEmail(current, clean);
  }, []);
  const changePassword = useCallback(async (password: string, currentPassword: string) => {
    if (password.length < 8) throw Error('Use at least 8 characters for your new password.');
    const current = await reauthenticate(currentPassword);
    await updatePassword(current, password);
  }, []);
  const value = useMemo(() => ({ user, loading: loading || provisioning, accountDetails, saveAccountDetails, changeEmail, changePassword, signIn, signUp, resetPassword, signOut }), [loading, provisioning, accountDetails, saveAccountDetails, changeEmail, changePassword, resetPassword, signIn, signOut, signUp, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
