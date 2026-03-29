import { ClubType } from '@types/club';
import { Admin } from '@services/firebase/auth-service';
import { User } from 'firebase/auth';
import { createContext } from 'react';

export interface AuthContextType {
  currentUser: User | null;
  currentAdmin: Admin | null;
  loading: boolean;
  error: string | null;
  loginAdmin: (email: string, password: string) => Promise<void>;
  registerAdmin: (email: string, password: string, name: string, clubName?: string, clubType?: ClubType, clubCode?: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
