import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { StallProvider } from "@/contexts/StallContext";
import { useEffect } from "react";
import { initializeSampleData } from "@/services/storageService";
import MobileNavBar from "@/components/MobileNavBar";
import { useIsMobile } from "@/hooks/use-mobile";

// Pages
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import BooksPage from "./pages/BooksPage";
import SellBookPage from "./pages/SellBookPage";
import AddBookPage from "./pages/AddBookPage";
import SalesPage from "./pages/SalesPage";
import ReportsPage from "./pages/ReportsPage";
import NotFound from "./pages/NotFound";
import SearchPage from "./pages/SearchPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import CompleteSignupPage from "./pages/CompleteSignupPage";
import SettingsPage from "./pages/SettingsPage";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Admin route component
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppContent = () => {
  const { isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  
  // Initialize sample data on first load
  useEffect(() => {
    initializeSampleData();
  }, []);
  
  return (
    <div className="min-h-screen bg-temple-background">
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/" /> : <LoginPage />
        } />
        
        <Route path="/complete-signup/:inviteCode" element={<CompleteSignupPage />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        
        <Route path="/books" element={
          <ProtectedRoute>
            <BooksPage />
          </ProtectedRoute>
        } />
        
        <Route path="/search" element={
          <ProtectedRoute>
            <SearchPage />
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        
        <Route path="/sell/:bookId" element={
          <ProtectedRoute>
            <SellBookPage />
          </ProtectedRoute>
        } />
        
        <Route path="/add-book" element={
          <AdminRoute>
            <AddBookPage />
          </AdminRoute>
        } />
        
        <Route path="/sales" element={
          <ProtectedRoute>
            <SalesPage />
          </ProtectedRoute>
        } />
        
        <Route path="/reports" element={
          <AdminRoute>
            <ReportsPage />
          </AdminRoute>
        } />
        
        <Route path="/admin" element={
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        } />
        
        <Route path="/settings" element={
          <AdminRoute>
            <SettingsPage />
          </AdminRoute>
        } />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {isAuthenticated && isMobile && <MobileNavBar />}
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <StallProvider>
          <AppContent />
          <Toaster />
          <Sonner />
        </StallProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
