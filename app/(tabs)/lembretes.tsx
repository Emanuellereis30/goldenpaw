import RemindersScreen from '@/app/components/RemindersScreen';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { auth } from '../../firebaseConfig';

export default function LembretesRoute() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleNavigateToLogin = () => {
    router.push('/login');
  };

  return (
    <RemindersScreen
      isLoggedIn={isLoggedIn}
      onNavigateToLogin={handleNavigateToLogin}
    />
  );
}
