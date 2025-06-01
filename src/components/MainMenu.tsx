
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { 
  BookOpen, 
  Plus, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  Search,
  Users,
  Languages
} from "lucide-react";

const MainMenu = () => {
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();
  const { t, i18n } = useTranslation();

  const menuItems = [
    {
      title: t("common.books"),
      description: t("common.viewManageBooks"),
      icon: BookOpen,
      action: () => navigate("/books"),
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      title: t("common.addBook"),
      description: t("common.addNewBookToInventory"),
      icon: Plus,
      action: () => navigate("/books/add"),
      color: "bg-green-500 hover:bg-green-600",
      adminOnly: true
    },
    {
      title: t("common.sell"),
      description: t("common.sellBooksToCustomers"),
      icon: ShoppingCart,
      action: () => navigate("/sell"),
      color: "bg-purple-500 hover:bg-purple-600"
    },
    {
      title: t("common.sellMultiple"),
      description: t("common.sellMultipleBooksAtOnce"),
      icon: ShoppingCart,
      action: () => navigate("/sell-multiple"),
      color: "bg-indigo-500 hover:bg-indigo-600"
    },
    {
      title: t("common.search"),
      description: t("common.searchAndFilterBooks"),
      icon: Search,
      action: () => navigate("/search"),
      color: "bg-orange-500 hover:bg-orange-600"
    },
    {
      title: t("common.reports"),
      description: t("common.viewSalesReports"),
      icon: BarChart3,
      action: () => navigate("/reports"),
      color: "bg-red-500 hover:bg-red-600"
    },
    {
      title: t("common.admin"),
      description: t("common.userManagement"),
      icon: Users,
      action: () => navigate("/admin"),
      color: "bg-gray-500 hover:bg-gray-600",
      adminOnly: true
    },
    {
      title: t("common.settings"),
      description: t("common.appSettings"),
      icon: Settings,
      action: () => navigate("/settings"),
      color: "bg-teal-500 hover:bg-teal-600",
      adminOnly: true
    }
  ];

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const filteredMenuItems = menuItems.filter(item => 
    !item.adminOnly || isAdmin
  );

  return (
    <div className="space-y-6">
      {/* Language Selector */}
      <Card className="temple-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Languages className="h-5 w-5 text-temple-gold" />
            <div className="flex-1">
              <h3 className="font-medium text-temple-maroon">{t("common.selectLanguage")}</h3>
              <Select value={i18n.language} onValueChange={changeLanguage}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">हिंदी</SelectItem>
                  <SelectItem value="kn">ಕನ್ನಡ</SelectItem>
                  <SelectItem value="ta">தமிழ்</SelectItem>
                  <SelectItem value="te">తెలుగు</SelectItem>
                  <SelectItem value="mr">मराठी</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredMenuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <Card key={index} className="temple-card hover:shadow-lg transition-shadow cursor-pointer" onClick={item.action}>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${item.color} text-white`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-temple-maroon mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {item.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MainMenu;
