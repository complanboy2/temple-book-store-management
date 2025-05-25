
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Book, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  Plus, 
  Search,
  Package,
  FileText,
  Database
} from "lucide-react";

const MainMenu = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { t } = useTranslation();

  const menuItems = [
    {
      title: t("common.books"),
      description: t("common.manageBooks"),
      icon: Book,
      path: "/books",
      color: "bg-blue-500"
    },
    {
      title: t("common.addBook"),
      description: t("common.addNewBook"),
      icon: Plus,
      path: "/books/add",
      color: "bg-green-500"
    },
    {
      title: t("common.sell"),
      description: t("common.sellBooks"),
      icon: ShoppingCart,
      path: "/sell-multiple",
      color: "bg-orange-500"
    },
    {
      title: t("common.search"),
      description: t("common.searchBooks"),
      icon: Search,
      path: "/search",
      color: "bg-purple-500"
    }
  ];

  const adminItems = [
    {
      title: t("common.reports"),
      description: t("common.viewReports"),
      icon: BarChart3,
      path: "/reports",
      color: "bg-indigo-500"
    },
    {
      title: t("common.orders"),
      description: t("common.manageOrders"),
      icon: Package,
      path: "/orders",
      color: "bg-teal-500"
    },
    {
      title: t("common.sales"),
      description: t("common.viewSales"),
      icon: FileText,
      path: "/sales",
      color: "bg-red-500"
    },
    {
      title: t("common.metadata"),
      description: t("common.manageMetadata"),
      icon: Database,
      path: "/metadata",
      color: "bg-pink-500"
    },
    {
      title: t("common.settings"),
      description: t("common.appSettings"),
      icon: Settings,
      path: "/settings",
      color: "bg-gray-500"
    }
  ];

  const allItems = isAdmin ? [...menuItems, ...adminItems] : menuItems;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {allItems.map((item) => {
        const IconComponent = item.icon;
        return (
          <Card
            key={item.path}
            className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate(item.path)}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${item.color} text-white flex-shrink-0`}>
                <IconComponent className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm mb-1 truncate">{item.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default MainMenu;
