
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, BookOpen, BarChart2, PlusCircle, Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const MobileNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-temple-gold/30 shadow-lg z-50">
      <div className="flex justify-around items-center h-16">
        <button
          onClick={() => navigate("/")}
          className={`flex flex-col items-center justify-center w-full h-full ${
            isActive("/") ? "text-temple-saffron" : "text-gray-500"
          }`}
        >
          <Home size={24} />
          <span className="text-xs mt-1">Home</span>
        </button>
        
        <button
          onClick={() => navigate("/books")}
          className={`flex flex-col items-center justify-center w-full h-full ${
            isActive("/books") ? "text-temple-saffron" : "text-gray-500"
          }`}
        >
          <BookOpen size={24} />
          <span className="text-xs mt-1">Books</span>
        </button>
        
        {isAdmin && (
          <button
            onClick={() => navigate("/add-book")}
            className={`flex flex-col items-center justify-center w-full h-full ${
              isActive("/add-book") ? "text-temple-saffron" : "text-gray-500"
            }`}
          >
            <PlusCircle size={24} />
            <span className="text-xs mt-1">Add Book</span>
          </button>
        )}
        
        <button
          onClick={() => navigate("/sales")}
          className={`flex flex-col items-center justify-center w-full h-full ${
            isActive("/sales") ? "text-temple-saffron" : "text-gray-500"
          }`}
        >
          <BarChart2 size={24} />
          <span className="text-xs mt-1">Sales</span>
        </button>
        
        {isAdmin && (
          <button
            onClick={() => navigate("/reports")}
            className={`flex flex-col items-center justify-center w-full h-full ${
              isActive("/reports") ? "text-temple-saffron" : "text-gray-500"
            }`}
          >
            <Menu size={24} />
            <span className="text-xs mt-1">More</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default MobileNavBar;
