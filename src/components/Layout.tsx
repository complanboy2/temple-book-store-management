
import React from "react";
import MobileNavBar from "@/components/MobileNavBar";
import { useLocation } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  // List of routes that shouldn't show the bottom navigation
  const hideNavbarRoutes = ["/login", "/complete-signup"];
  
  const shouldShowNavbar = !hideNavbarRoutes.some(route => 
    location.pathname.startsWith(route)
  );
  
  return (
    <div className="min-h-screen bg-temple-background">
      {children}
      {shouldShowNavbar && <MobileNavBar />}
      {/* Add padding at bottom to account for the navbar */}
      {shouldShowNavbar && <div className="h-16"></div>}
    </div>
  );
};

export default Layout;
