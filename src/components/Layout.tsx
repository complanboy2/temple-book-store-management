
import React from "react";
import MobileNavBar from "@/components/MobileNavBar";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoginPage from "@/pages/LoginPage";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  
  // List of routes that shouldn't show the bottom navigation
  const hideNavbarRoutes = ["/login", "/complete-signup"];
  
  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/complete-signup", "/privacy-policy"];
  
  const shouldShowNavbar = !hideNavbarRoutes.some(route => 
    location.pathname.startsWith(route)
  );
  
  const isPublicRoute = publicRoutes.some(route => 
    location.pathname.startsWith(route)
  );

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-temple-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-temple-maroon mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated and trying to access protected route, show login
  if (!isAuthenticated && !isPublicRoute) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-temple-background">
      <div className="pb-16">
        {children}
      </div>
      {shouldShowNavbar && isAuthenticated && <MobileNavBar />}
    </div>
  );
};

export default Layout;
