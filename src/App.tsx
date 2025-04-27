
import { Route, Routes } from "react-router-dom";
import React, { Suspense, lazy, useEffect } from "react";
import { useStallContext } from "./contexts/StallContext";
import { useToast } from "./hooks/use-toast";

import "./App.css";
import { Toaster } from "./components/ui/toaster";
import LoginPage from "./pages/LoginPage";
import CompleteSignupPage from "./pages/CompleteSignupPage";
import SearchPage from "./pages/SearchPage";
import Layout from "./components/Layout";

// Lazy load routes to improve initial load performance
const Index = lazy(() => import("./pages/Index"));
const BooksPage = lazy(() => import("./pages/BooksPage"));
const SellBookPage = lazy(() => import("./pages/SellBookPage"));
const AddBookPage = lazy(() => import("./pages/AddBookPage"));
const SalesPage = lazy(() => import("./pages/SalesPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const MetadataManagerPage = lazy(() => import("./pages/MetadataManagerPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const SuperAdminPage = lazy(() => import("./pages/SuperAdminPage"));
const OrdersPage = lazy(() => import("./pages/OrdersPage"));
const OrderManagementPage = lazy(() => import("./pages/OrderManagementPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Import service to initialize sample data
import { initializeSampleData } from "./services/storageService";
import { checkSupabaseConnection } from "./integrations/supabase/client";

function App() {
  const { currentStore } = useStallContext();
  const { toast } = useToast();

  useEffect(() => {
    // Check if sample data exists, otherwise initialize
    initializeSampleData();
    
    // Check Supabase connection
    const checkConnection = async () => {
      const isConnected = await checkSupabaseConnection();
      console.log("Supabase connection status:", isConnected);
    };
    
    checkConnection();
  }, []);

  return (
    <div className="app">
      <Suspense fallback={<div className="loading">Loading...</div>}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/complete-signup/:token" element={<CompleteSignupPage />} />
          <Route 
            path="/" 
            element={
              <Layout>
                <Index />
              </Layout>
            } 
          />
          <Route
            path="/search"
            element={
              <Layout>
                <SearchPage />
              </Layout>
            }
          />
          <Route
            path="/books"
            element={
              <Layout>
                <BooksPage />
              </Layout>
            }
          />
          <Route
            path="/sell/:bookId"
            element={
              <Layout>
                <SellBookPage />
              </Layout>
            }
          />
          <Route
            path="/add-book"
            element={
              <Layout>
                <AddBookPage />
              </Layout>
            }
          />
          <Route
            path="/sales"
            element={
              <Layout>
                <SalesPage />
              </Layout>
            }
          />
          <Route
            path="/profile"
            element={
              <Layout>
                <ProfilePage />
              </Layout>
            }
          />
          <Route
            path="/settings"
            element={
              <Layout>
                <SettingsPage />
              </Layout>
            }
          />
          <Route
            path="/metadata"
            element={
              <Layout>
                <MetadataManagerPage />
              </Layout>
            }
          />
          <Route
            path="/reports"
            element={
              <Layout>
                <ReportsPage />
              </Layout>
            }
          />
          <Route
            path="/dashboard"
            element={
              <Layout>
                <DashboardPage />
              </Layout>
            }
          />
          <Route
            path="/admin"
            element={
              <Layout>
                <AdminPage />
              </Layout>
            }
          />
          <Route
            path="/super-admin"
            element={
              <Layout>
                <SuperAdminPage />
              </Layout>
            }
          />
          <Route
            path="/orders"
            element={
              <Layout>
                <OrdersPage />
              </Layout>
            }
          />
          <Route
            path="/order-management"
            element={
              <Layout>
                <OrderManagementPage />
              </Layout>
            }
          />
          <Route
            path="*"
            element={
              <Layout>
                <NotFound />
              </Layout>
            }
          />
        </Routes>
      </Suspense>
      <Toaster />
    </div>
  );
}

export default App;
