import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { LoadingScreen } from './LoadingScreen';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, booting } = useAuth();
  const location = useLocation();
  if (booting) return <LoadingScreen label="正在确认登录状态" />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  return children;
}
