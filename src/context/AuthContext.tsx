import { authService } from '@services/firebase/auth-service';
import { User } from 'firebase/auth';
import React, { useCallback, useEffect, useState } from 'react';
import { AuthContext, AuthContextType } from './AuthContextType';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (user) => {
      setCurrentUser(user);

      if (user) {
        try {
          const admin = await authService.getCurrentAdmin();
          setCurrentAdmin(admin);
        } catch (err) {
          setCurrentAdmin(null);
          setError('Failed to load admin data');
        }
      } else {
        setCurrentAdmin(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
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

  const registerAdmin = useCallback(async (email: string, password: string, name: string) => {
    try {
      setError(null);
      const admin = await authService.registerAdmin(email, password, name);
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
