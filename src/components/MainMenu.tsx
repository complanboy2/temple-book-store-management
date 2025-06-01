
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { 
  BookOpen, 
  ShoppingCart, 
  Plus, 
  BarChart3, 
  Search,
  Users,
  Settings
} from "lucide-react";

const MainMenu = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { t } = useTranslation();

  const menuItems = [
    {
      title: t("common.books"),
      description: t("menu.viewManageBooks"),
      icon: BookOpen,
      path: "/books",
      color: "bg-temple-saffron hover:bg-temple-saffron/90"
    },
    {
      title: t("common.sell"),
      description: t("menu.sellBooks"),
      icon: ShoppingCart,
      path: "/sell",
      color: "bg-temple-maroon hover:bg-temple-maroon/90"
    },
    {
      title: t("menu.sellMultiple"),
      description: t("menu.sellMultipleBooks"),
      icon: ShoppingCart,
      path: "/sell-multiple",
      color: "bg-temple-gold hover:bg-temple-gold/90"
    },
    {
      title: t("common.addBook"),
      description: t("menu.addNewBook"),
      icon: Plus,
      path: "/books/add",
      color: "bg-green-600 hover:bg-green-700"
    },
    {
      title: t("common.search"),
      description: t("menu.searchBooks"),
      icon: Search,
      path: "/search",
      color: "bg-blue-600 hover:bg-blue-700"
    },
    {
      title: t("common.reports"),
      description: t("menu.viewReports"),
      icon: BarChart3,
      path: "/reports",
      color: "bg-purple-600 hover:bg-purple-700"
    }
  ];

  // Add admin-only items
  if (isAdmin) {
    menuItems.push(
      {
        title: t("common.admin"),
        description: t("menu.adminPanel"),
        icon: Users,
        path: "/admin",
        color: "bg-red-600 hover:bg-red-700"
      },
      {
        title: t("common.settings"),
        description: t("menu.appSettings"),
        icon: Settings,
        path: "/settings",
        color: "bg-gray-600 hover:bg-gray-700"
      }
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {menuItems.map((item) => {
        const IconComponent = item.icon;
        return (
          <Card key={item.path} className="temple-card hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4" onClick={() => navigate(item.path)}>
              <div className="flex flex-col items-center text-center space-y-3">
                <div className={`p-3 rounded-full ${item.color} text-white`}>
                  <IconComponent size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-temple-maroon text-sm">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    {item.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MainMenu;
