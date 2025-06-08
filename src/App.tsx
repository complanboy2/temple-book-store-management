
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { StallProvider } from "@/contexts/StallContext";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import CompleteSignupPage from "./pages/CompleteSignupPage";
import DashboardPage from "./pages/DashboardPage";
import BooksPage from "./pages/BooksPage";
import AddBookPage from "./pages/AddBookPage";
import EditBookPage from "./pages/EditBookPage";
import SellBookPage from "./pages/SellBookPage";
import SellMultipleBooksPage from "./pages/SellMultipleBooksPage";
import SalesPage from "./pages/SalesPage";
import SalesHistoryPage from "./pages/SalesHistoryPage";
import ReportsPage from "./pages/ReportsPage";
import OrdersPage from "./pages/OrdersPage";
import NewOrderPage from "./pages/NewOrderPage";
import OrderManagementPage from "./pages/OrderManagementPage";
import SettingsPage from "./pages/SettingsPage";
import SearchPage from "./pages/SearchPage";
import AdminPage from "./pages/AdminPage";
import MetadataManagerPage from "./pages/MetadataManagerPage";
import ProfilePage from "./pages/ProfilePage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import NotFound from "./pages/NotFound";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <StallProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/complete-signup" element={<CompleteSignupPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/books" element={<BooksPage />} />
                <Route path="/books/add" element={<AddBookPage />} />
                <Route path="/books/edit/:bookId" element={<EditBookPage />} />
                <Route path="/books/sell/:bookId" element={<SellBookPage />} />
                <Route path="/books/sell-multiple" element={<SellMultipleBooksPage />} />
                <Route path="/sales" element={<SalesPage />} />
                <Route path="/sales/history" element={<SalesHistoryPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/orders/new" element={<NewOrderPage />} />
                <Route path="/orders/management" element={<OrderManagementPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/metadata" element={<MetadataManagerPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </StallProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
