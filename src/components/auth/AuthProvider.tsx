
import React from 'react';
import { useAuthProvider, AuthContext } from '@/hooks/useAuth';
import { useAuthCleanup } from '@/hooks/useAuthCleanup';

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider = ({ children }: AuthProviderProps) => {
  const auth = useAuthProvider();
  
  // Executar limpeza automática na inicialização
  useAuthCleanup();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
