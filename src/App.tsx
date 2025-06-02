
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { StallProvider } from "@/contexts/StallContext";
import { useAuth } from "@/contexts/AuthContext";
import "./i18n";

import Layout from "@/components/Layout";
import Index from "@/pages/Index";
import BooksPage from "@/pages/BooksPage";
import AddBookPage from "@/pages/AddBookPage";
import EditBookPage from "@/pages/EditBookPage";
import SearchPage from "@/pages/SearchPage";
import SellBookPage from "@/pages/SellBookPage";
import SellMultipleBooksPage from "@/pages/SellMultipleBooksPage";
import ReportsPage from "@/pages/ReportsPage";
import AdminPage from "@/pages/AdminPage";
import SettingsPage from "@/pages/SettingsPage";
import ProfilePage from "@/pages/ProfilePage";
import LoginPage from "@/pages/LoginPage";
import CompleteSignupPage from "@/pages/CompleteSignupPage";
import MetadataManagerPage from "@/pages/MetadataManagerPage";
import OrdersPage from "@/pages/OrdersPage";
import NewOrderPage from "@/pages/NewOrderPage";
import OrderManagementPage from "@/pages/OrderManagementPage";
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <StallProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/complete-signup" element={<CompleteSignupPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Index />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/books" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <BooksPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/books/add" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <AddBookPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/books/edit/:id" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <EditBookPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/search" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <SearchPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/sell" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <SellBookPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/sell/:bookId" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <SellBookPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/sell-multiple" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <SellMultipleBooksPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/reports" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ReportsPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <AdminPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <SettingsPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ProfilePage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/metadata" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <MetadataManagerPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/orders" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <OrdersPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/orders/new" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <NewOrderPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/order-management" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <OrderManagementPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </StallProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
