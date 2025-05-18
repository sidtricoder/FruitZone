import { useContext } from 'react';
import { AuthContext, AuthContextType } from '../contexts/AuthContext'; // AuthContext will be created next

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
