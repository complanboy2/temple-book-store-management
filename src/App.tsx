
import React from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Route,
  Routes,
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
        <Index />
      </ProtectedRoute>
    ),
  },
  {
    path: "/books",
    element: (
      <ProtectedRoute>
        <BooksPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/sales",
    element: (
      <ProtectedRoute>
        <SalesPage />
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
        <AddBookPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/sell/:bookId",
    element: (
      <ProtectedRoute>
        <SellBookPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/sell/new",
    element: (
      <ProtectedRoute>
        <SellBookPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute>
        <SuperAdminPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/edit-book/:bookId",
    element: (
      <ProtectedRoute>
        <EditBookPage />
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
