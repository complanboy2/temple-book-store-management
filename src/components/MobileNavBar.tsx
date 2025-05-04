
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, BookOpen, BarChart2, Settings, ShoppingCart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { useStallContext } from "@/contexts/StallContext";

const MobileNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();
  const { t } = useTranslation();
  const { currentStore } = useStallContext();
  
  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Handler for sell button to navigate directly to books page for selling
  const handleSellClick = () => {
    navigate("/books");
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-temple-gold/30 shadow-lg z-40 pb-safe">
      <div className="flex justify-around items-center h-16">
        <button
          onClick={() => navigate("/")}
          className={`flex flex-col items-center justify-center w-full h-full ${
            isActive("/") ? "text-temple-saffron" : "text-gray-500"
          }`}
        >
          <Home size={24} />
          <span className="text-xs mt-1">{t("common.home")}</span>
        </button>
        
        <button
          onClick={() => navigate("/books")}
          className={`flex flex-col items-center justify-center w-full h-full ${
            isActive("/books") ? "text-temple-saffron" : "text-gray-500"
          }`}
        >
          <BookOpen size={24} />
          <span className="text-xs mt-1">{t("common.books")}</span>
        </button>
        
        <button
          onClick={handleSellClick}
          className={`flex flex-col items-center justify-center w-full h-full ${
            isActive("/sell") ? "text-temple-saffron" : "text-gray-500"
          }`}
        >
          <ShoppingCart size={24} />
          <span className="text-xs mt-1">{t("common.sell")}</span>
        </button>
        
        <button
          onClick={() => navigate("/sales")}
          className={`flex flex-col items-center justify-center w-full h-full ${
            isActive("/sales") ? "text-temple-saffron" : "text-gray-500"
          }`}
        >
          <BarChart2 size={24} />
          <span className="text-xs mt-1">{t("common.sales")}</span>
        </button>
        
        {isAdmin && (
          <button
            onClick={() => navigate("/settings")}
            className={`flex flex-col items-center justify-center w-full h-full ${
              isActive("/admin") || isActive("/settings") || isActive("/reports") ? "text-temple-saffron" : "text-gray-500"
            }`}
          >
            <Settings size={24} />
            <span className="text-xs mt-1">{t("common.more")}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default MobileNavBar;
