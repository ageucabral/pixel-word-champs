
import { User } from '@/types';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { emailOrPhone: string; password: string; rememberMe?: boolean }) => Promise<void>;
  register: (userData: { emailOrPhone: string; password: string; username: string }) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (emailOrPhone: string) => Promise<{ success: boolean; error?: string }>;
  error: string | undefined;
}
