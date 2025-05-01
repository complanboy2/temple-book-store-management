
import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Layout from "@/components/Layout";

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
        <Route path="/" element={<Layout><Index /></Layout>} />
        <Route path="/books" element={<Layout><BooksPage /></Layout>} />
        <Route path="/add-book" element={<Layout><AddBookPage /></Layout>} />
        <Route path="/books/:id" element={<Layout><AddBookPage /></Layout>} />
        <Route path="/sell/new" element={<Layout><SellBookPage /></Layout>} />
        <Route path="/sell/:id" element={<Layout><SellBookPage /></Layout>} />
        <Route path="/sales" element={<Layout><SalesPage /></Layout>} />
        <Route path="/search" element={<Layout><SearchPage /></Layout>} />
        <Route path="/profile" element={<Layout><ProfilePage /></Layout>} />
        <Route path="/settings" element={<Layout><SettingsPage /></Layout>} />
        <Route path="/admin" element={<Layout><AdminPage /></Layout>} />
        <Route path="/reports" element={<Layout><ReportsPage /></Layout>} />
        <Route path="/orders" element={<Layout><OrdersPage /></Layout>} />
        <Route path="/orders/new" element={<Layout><OrderManagementPage /></Layout>} />
        <Route path="/orders/:id" element={<Layout><OrderManagementPage /></Layout>} />
        <Route path="/super-admin" element={<Layout><SuperAdminPage /></Layout>} />
        <Route path="/metadata" element={<Layout><MetadataManagerPage /></Layout>} />
        <Route path="/privacy-policy" element={<Layout><PrivacyPolicyPage /></Layout>} />
        <Route path="*" element={<Layout><NotFound /></Layout>} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
