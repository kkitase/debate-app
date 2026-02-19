import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { onIdTokenChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const email = firebaseUser.email;
          if (!email) throw new Error('Email not found');
          
          const userDoc = await getDoc(doc(db, 'allowed_users', email));
          if (userDoc.exists()) {
            setIsAllowed(true);
            setUser(firebaseUser);
            const token = await firebaseUser.getIdToken();
            setIdToken(token);
          } else {
            console.error('[auth] User not in whitelist:', email);
            setIsAllowed(false);
            setUser(null);
            setIdToken(null);
            await signOut(auth);
          }
        } catch (err) {
          console.error('[auth] Error checking whitelist:', err);
          setIsAllowed(false);
          await signOut(auth);
        }
      } else {
        setUser(null);
        setIdToken(null);
        setIsAllowed(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { user, idToken, authLoading, isAllowed, signOut: () => signOut(auth) };
}
