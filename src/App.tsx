
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
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
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import CompleteSignupPage from "./pages/CompleteSignupPage";
import SellBookPage from "./pages/SellBookPage";
import SettingsPage from "./pages/SettingsPage";
import ReportsPage from "./pages/ReportsPage";
import MetadataManagerPage from "./pages/MetadataManagerPage";
import OrderManagementPage from "./pages/OrderManagementPage";
import OrdersPage from "./pages/OrdersPage";
import ProfilePage from "./pages/ProfilePage";
import NewOrderPage from "./pages/NewOrderPage";
import SellMultipleBooksPage from "./pages/SellMultipleBooksPage";
import Layout from "./components/Layout";

function App() {
  const [initialized, setInitialized] = useState(true);

  return (
    <Router>
      <Layout>
        <Routes>
          {/* Set dashboard as home page */}
          <Route path="/" element={<DashboardPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/complete-signup" element={<CompleteSignupPage />} />
          <Route path="/complete-signup/:inviteCode" element={<CompleteSignupPage />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/books/add" element={<AddBookPage />} />
          <Route path="/books/edit/:bookId" element={<EditBookPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/sell/:id" element={<SellBookPage />} />
          <Route path="/sell/new" element={<SellBookPage />} />
          <Route path="/sell-multiple" element={<SellMultipleBooksPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/metadata" element={<MetadataManagerPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/new" element={<NewOrderPage />} />
          <Route path="/order-management" element={<OrderManagementPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
      <Toaster position="top-center" />
    </Router>
  );
}

export default App;
