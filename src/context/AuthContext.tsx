import { ClubType } from '@types/club';
import { authService } from '@services/firebase/auth-service';
import { User } from 'firebase/auth';
import React, { useCallback, useEffect, useState } from 'react';
import { AuthContext, AuthContextType } from './AuthContextType';
import { authReady } from '@services/firebase/firebase';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe = () => undefined;

    authReady.finally(() => {
      if (!isMounted) return;

      unsubscribe = authService.onAuthStateChange(async (user) => {
        if (!isMounted) return;
        setCurrentUser(user);

        if (user) {
          try {
            const admin = await authService.getAdminForUserId(user.uid);
            if (!isMounted) return;
            setCurrentAdmin(admin);
          } catch (err) {
            if (!isMounted) return;
            setCurrentAdmin(null);
            setError('Failed to load admin data');
          }
        } else {
          setCurrentAdmin(null);
        }

        if (isMounted) setLoading(false);
      });
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const loginAdmin = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      const admin = await authService.loginAdmin(email, password);
      setCurrentAdmin(admin);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to login';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const registerAdmin = useCallback(async (email: string, password: string, name: string, clubName?: string, clubType: ClubType = 'rotaract', clubCode?: string) => {
    try {
      setError(null);
      const admin = await authService.registerAdmin(email, password, name, 'club_admin', clubName, clubType, clubCode);
      setCurrentAdmin(admin);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to register';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setError(null);
      await authService.signOut();
      setCurrentUser(null);
      setCurrentAdmin(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign out';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextType = {
    currentUser,
    currentAdmin,
    loading,
    error,
    loginAdmin,
    registerAdmin,
    signOut,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
