
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { 
  BookOpen, 
  ShoppingCart, 
  Package, 
  BarChart3, 
  TrendingUp, 
  ShoppingBag,
  Users
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const MainMenu = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAdmin } = useAuth();

  const menuItems = [
    {
      title: t("common.viewBooks"),
      description: t("common.viewAllBooks"),
      icon: BookOpen,
      path: "/books",
      bgColor: "bg-blue-500",
      textColor: "text-blue-700",
      hoverColor: "hover:bg-blue-600"
    },
    {
      title: t("common.sell"),
      description: t("common.sellBooks"),
      icon: ShoppingCart,
      path: "/sell",
      bgColor: "bg-green-500",
      textColor: "text-green-700",
      hoverColor: "hover:bg-green-600"
    },
    {
      title: t("common.sellMultiple"),
      description: t("common.sellMultipleBooks"),
      icon: ShoppingBag,
      path: "/sell-multiple",
      bgColor: "bg-purple-500",
      textColor: "text-purple-700",
      hoverColor: "hover:bg-purple-600"
    },
    {
      title: t("common.addBook"),
      description: t("common.addNewBook"),
      icon: Package,
      path: "/books/add",
      bgColor: "bg-orange-500",
      textColor: "text-orange-700",
      hoverColor: "hover:bg-orange-600"
    },
    {
      title: t("common.sales"),
      description: t("common.viewSalesHistory"),
      icon: TrendingUp,
      path: "/sales",
      bgColor: "bg-indigo-500",
      textColor: "text-indigo-700",
      hoverColor: "hover:bg-indigo-600"
    },
    {
      title: t("common.reports"),
      description: t("common.viewReports"),
      icon: BarChart3,
      path: "/reports",
      bgColor: "bg-teal-500",
      textColor: "text-teal-700",
      hoverColor: "hover:bg-teal-600"
    }
  ];

  // Add admin-only items
  if (isAdmin) {
    menuItems.push({
      title: t("common.admin"),
      description: t("common.adminPanel"),
      icon: Users,
      path: "/admin",
      bgColor: "bg-red-500",
      textColor: "text-red-700",
      hoverColor: "hover:bg-red-600"
    });
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {menuItems.map((item) => {
        const IconComponent = item.icon;
        return (
          <Card 
            key={item.path}
            className="overflow-hidden transition-all duration-200 hover:shadow-lg cursor-pointer"
            onClick={() => navigate(item.path)}
          >
            <CardContent className="p-0">
              <div className={`${item.bgColor} ${item.hoverColor} p-4 transition-colors duration-200`}>
                <IconComponent className="h-8 w-8 text-white mb-2" />
              </div>
              <div className="p-3">
                <h3 className={`font-semibold text-sm ${item.textColor} mb-1`}>
                  {item.title}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MainMenu;
