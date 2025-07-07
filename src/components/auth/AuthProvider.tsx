
import React from 'react';
import { useUnifiedAuth, AuthContext } from '@/hooks/useAuth';
import { useAuthCleanup } from '@/hooks/useAuthCleanup';

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider = ({ children }: AuthProviderProps) => {
  const auth = useUnifiedAuth();
  
  // Executar limpeza automática na inicialização
  useAuthCleanup();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
