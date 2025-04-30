
import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";

import Index from "@/pages/Index";
import BooksPage from "@/pages/BooksPage";
import AddBookPage from "@/pages/AddBookPage";
import SellBookPage from "@/pages/SellBookPage";
import SalesPage from "@/pages/SalesPage";
import AdminPage from "@/pages/AdminPage";
import ReportsPage from "@/pages/ReportsPage";
import SearchPage from "@/pages/SearchPage";
import SettingsPage from "@/pages/SettingsPage";
import LoginPage from "@/pages/LoginPage";
import ProfilePage from "@/pages/ProfilePage";
import NotFound from "@/pages/NotFound";
import OrdersPage from "@/pages/OrdersPage";
import OrderManagementPage from "@/pages/OrderManagementPage";
import SuperAdminPage from "@/pages/SuperAdminPage";
import CompleteSignupPage from "@/pages/CompleteSignupPage";
import MetadataManagerPage from "@/pages/MetadataManagerPage";
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";

import "./i18n";
import "./App.css";

function App() {
  useEffect(() => {
    document.title = "Book Store Manager";
  }, []);

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/complete-signup/:code" element={<CompleteSignupPage />} />
        <Route path="/" element={<Index />} />
        <Route path="/books" element={<BooksPage />} />
        <Route path="/books/add" element={<AddBookPage />} />
        <Route path="/books/:id" element={<AddBookPage />} />
        <Route path="/sell/new" element={<SellBookPage />} />
        <Route path="/sell/:id" element={<SellBookPage />} />
        <Route path="/sales" element={<SalesPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/new" element={<OrderManagementPage />} />
        <Route path="/orders/:id" element={<OrderManagementPage />} />
        <Route path="/super-admin" element={<SuperAdminPage />} />
        <Route path="/metadata" element={<MetadataManagerPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
