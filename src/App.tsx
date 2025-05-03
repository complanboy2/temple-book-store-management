
import React from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Index from "./pages/Index";
import BooksPage from "./pages/BooksPage";
import SalesPage from "./pages/SalesPage";
import LoginPage from "./pages/LoginPage";
import AddBookPage from "./pages/AddBookPage";
import SellBookPage from "./pages/SellBookPage";
import SuperAdminPage from "./pages/SuperAdminPage";
import EditBookPage from "./pages/EditBookPage";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import SettingsPage from "./pages/SettingsPage";
import MetadataManagerPage from "./pages/MetadataManagerPage";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return React.Children.only(children);
};

// Create router configuration outside of the component
const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout>
          <Index />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/books",
    element: (
      <ProtectedRoute>
        <Layout>
          <BooksPage />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/sales",
    element: (
      <ProtectedRoute>
        <Layout>
          <SalesPage />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/add-book",
    element: (
      <ProtectedRoute>
        <Layout>
          <AddBookPage />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/sell/:bookId",
    element: (
      <ProtectedRoute>
        <Layout>
          <SellBookPage />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/sell/new",
    element: (
      <ProtectedRoute>
        <Layout>
          <SellBookPage />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute>
        <Layout>
          <SuperAdminPage />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/settings",
    element: (
      <ProtectedRoute>
        <Layout>
          <SettingsPage />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/metadata-manager",
    element: (
      <ProtectedRoute>
        <Layout>
          <MetadataManagerPage />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/edit-book/:bookId",
    element: (
      <ProtectedRoute>
        <Layout>
          <EditBookPage />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

function App() {
  return (
    <RouterProvider router={router} />
  );
}

export default App;
