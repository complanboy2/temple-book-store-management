
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import { Toaster } from "@/components/ui/sonner";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import BooksPage from "./pages/BooksPage";
import AddBookPage from "./pages/AddBookPage";
import EditBookPage from "./pages/EditBookPage";
import SalesPage from "./pages/SalesPage";
import SearchPage from "./pages/SearchPage";
import NotFound from "./pages/NotFound";
import AdminPage from "./pages/AdminPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import SuperAdminPage from "./pages/SuperAdminPage";
import CompleteSignupPage from "./pages/CompleteSignupPage";
import { AuthProvider } from "./contexts/AuthContext";
import { StallProvider } from "./contexts/StallContext";
import Index from "./pages/Index";
import MobileNavBar from "./components/MobileNavBar";
import { useIsMobile } from "./hooks/use-mobile";
import SellBookPage from "./pages/SellBookPage";
import SettingsPage from "./pages/SettingsPage";
import ReportsPage from "./pages/ReportsPage";
import MetadataManagerPage from "./pages/MetadataManagerPage";
import OrderManagementPage from "./pages/OrderManagementPage";
import OrdersPage from "./pages/OrdersPage";
import ProfilePage from "./pages/ProfilePage";

function App() {
  const isMobile = useIsMobile();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // We need to wait for the mobile check to be completed
    // before we can render the app
    if (typeof isMobile === "boolean") {
      setInitialized(true);
    }
  }, [isMobile]);

  if (!initialized) {
    return <div className="loading" />;
  }

  return (
    <AuthProvider>
      <StallProvider>
        <Router>
          <div className={isMobile ? "pb-16" : ""}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/complete-signup" element={<CompleteSignupPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/books" element={<BooksPage />} />
              <Route path="/books/add" element={<AddBookPage />} />
              <Route path="/books/edit/:id" element={<EditBookPage />} />
              <Route path="/sales" element={<SalesPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/super-admin" element={<SuperAdminPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/sell/:mode" element={<SellBookPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/metadata" element={<MetadataManagerPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/order-management" element={<OrderManagementPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            {isMobile && <MobileNavBar />}
          </div>
          <Toaster position="top-center" />
        </Router>
      </StallProvider>
    </AuthProvider>
  );
}

export default App;
