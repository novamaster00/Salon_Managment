import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import React, { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[]; 
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles = []
}: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();
  const { toast } = useToast();

  // Use useEffect to show toast after component is mounted
  useEffect(() => {
    // Only show toast if user is authenticated but not authorized
    if (!isLoading && isAuthenticated && user && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to access this page.',
        variant: 'destructive',
      });
    }
  }, [isAuthenticated, user, isLoading, allowedRoles, toast]);

  // Show loading state
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  // Not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} />;
  }
  
  // Authenticated but not authorized
  if (user && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }
  
  // Authenticated and authorized
  return <>{children}</>;
}