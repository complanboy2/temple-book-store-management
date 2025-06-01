
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { 
  BookOpen, 
  Plus, 
  ShoppingCart, 
  BarChart3, 
  Users, 
  Settings,
  Package,
  Search,
  Globe
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MainMenu: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();
  const { t, i18n } = useTranslation();

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
  };

  const menuItems = [
    {
      icon: BookOpen,
      title: t("common.books"),
      description: t("common.viewManageBooks"),
      onClick: () => navigate("/books"),
      color: "bg-temple-saffron hover:bg-temple-saffron/90",
      available: true
    },
    {
      icon: Plus,
      title: t("common.addBook"),
      description: t("common.addNewBookToInventory"),
      onClick: () => navigate("/books/add"),
      color: "bg-temple-maroon hover:bg-temple-maroon/90",
      available: currentUser?.canrestock || isAdmin
    },
    {
      icon: ShoppingCart,
      title: t("common.sell"),
      description: t("common.sellBooksToCustomers"),
      onClick: () => navigate("/sell"),
      color: "bg-green-600 hover:bg-green-700",
      available: currentUser?.cansell || isAdmin
    },
    {
      icon: Package,
      title: t("common.sellMultiple"),
      description: t("common.sellMultipleBooksAtOnce"),
      onClick: () => navigate("/sell-multiple"),
      color: "bg-blue-600 hover:bg-blue-700",
      available: currentUser?.cansell || isAdmin
    },
    {
      icon: Search,
      title: t("common.search"),
      description: t("common.searchAndFilterBooks"),
      onClick: () => navigate("/search"),
      color: "bg-purple-600 hover:bg-purple-700",
      available: true
    },
    {
      icon: BarChart3,
      title: t("common.reports"),
      description: t("common.viewSalesReports"),
      onClick: () => navigate("/reports"),
      color: "bg-orange-600 hover:bg-orange-700",
      available: true
    }
  ];

  const adminItems = [
    {
      icon: Users,
      title: t("admin.users"),
      description: t("common.userManagement"),
      onClick: () => navigate("/admin"),
      color: "bg-red-600 hover:bg-red-700",
      available: isAdmin
    },
    {
      icon: Settings,
      title: t("common.settings"),
      description: t("common.appSettings"),
      onClick: () => navigate("/settings"),
      color: "bg-gray-600 hover:bg-gray-700",
      available: true
    }
  ];

  const visibleMenuItems = menuItems.filter(item => item.available);
  const visibleAdminItems = adminItems.filter(item => item.available);

  return (
    <div className="space-y-4">
      {/* Language Selector */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-temple-maroon" />
              <span className="font-medium text-temple-maroon">{t("common.selectLanguage")}</span>
            </div>
            <Select value={i18n.language} onValueChange={changeLanguage}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">हिंदी</SelectItem>
                <SelectItem value="te">తెలుగు</SelectItem>
                <SelectItem value="ta">தமிழ்</SelectItem>
                <SelectItem value="kn">ಕನ್ನಡ</SelectItem>
                <SelectItem value="mr">मराठी</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Actions */}
      <div className="grid grid-cols-1 gap-3">
        {visibleMenuItems.map((item, index) => (
          <Card key={index} className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              <Button
                onClick={item.onClick}
                className={`w-full h-auto p-4 justify-start ${item.color} text-white`}
                variant="ghost"
              >
                <div className="flex items-center gap-4 w-full">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <p className="text-sm opacity-90 mt-1">{item.description}</p>
                  </div>
                </div>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Admin Section */}
      {visibleAdminItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide px-1">
            {t("common.administration")}
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {visibleAdminItems.map((item, index) => (
              <Card key={index} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <Button
                    onClick={item.onClick}
                    className={`w-full h-auto p-4 justify-start ${item.color} text-white`}
                    variant="ghost"
                  >
                    <div className="flex items-center gap-4 w-full">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <item.icon className="h-6 w-6" />
                      </div>
                      <div className="text-left flex-1">
                        <h3 className="font-semibold text-lg">{item.title}</h3>
                        <p className="text-sm opacity-90 mt-1">{item.description}</p>
                      </div>
                    </div>
                  </Button>
                </CardContent>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MainMenu;
