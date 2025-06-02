
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
      available: true
    },
    {
      icon: Plus,
      title: t("common.addBook"),
      description: t("common.addNewBookToInventory"),
      onClick: () => navigate("/books/add"),
      available: currentUser?.canRestock || isAdmin
    },
    {
      icon: ShoppingCart,
      title: t("common.sell"),
      description: t("common.sellBooksToCustomers"),
      onClick: () => navigate("/sell"),
      available: currentUser?.canSell || isAdmin
    },
    {
      icon: Package,
      title: t("common.sellMultiple"),
      description: t("common.sellMultipleBooksAtOnce"),
      onClick: () => navigate("/sell-multiple"),
      available: currentUser?.canSell || isAdmin
    },
    {
      icon: Search,
      title: t("common.search"),
      description: t("common.searchAndFilterBooks"),
      onClick: () => navigate("/search"),
      available: true
    },
    {
      icon: BarChart3,
      title: t("common.reports"),
      description: t("common.viewSalesReports"),
      onClick: () => navigate("/reports"),
      available: true
    }
  ];

  const adminItems = [
    {
      icon: Users,
      title: t("admin.users"),
      description: t("common.userManagement"),
      onClick: () => navigate("/admin"),
      available: isAdmin
    },
    {
      icon: Settings,
      title: t("common.settings"),
      description: t("common.appSettings"),
      onClick: () => navigate("/settings"),
      available: true
    }
  ];

  const visibleMenuItems = menuItems.filter(item => item.available);
  const visibleAdminItems = adminItems.filter(item => item.available);

  return (
    <div className="space-y-4">
      {/* Language Selector */}
      <Card className="shadow-sm">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">{t("common.selectLanguage")}</span>
            </div>
            <Select value={i18n.language} onValueChange={changeLanguage}>
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en" className="text-xs">EN</SelectItem>
                <SelectItem value="hi" className="text-xs">हिं</SelectItem>
                <SelectItem value="te" className="text-xs">తె</SelectItem>
                <SelectItem value="ta" className="text-xs">த</SelectItem>
                <SelectItem value="kn" className="text-xs">ಕ</SelectItem>
                <SelectItem value="mr" className="text-xs">म</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Actions */}
      <div className="grid grid-cols-1 gap-3">
        {visibleMenuItems.map((item, index) => (
          <Card key={index} className="shadow-sm hover:shadow-md transition-shadow border-gray-200">
            <CardContent className="p-0">
              <Button
                onClick={item.onClick}
                className="w-full h-auto p-4 justify-start bg-white hover:bg-gray-50 text-gray-800 border-0"
                variant="ghost"
              >
                <div className="flex items-center gap-4 w-full">
                  <div className="bg-gray-100 p-2 rounded-lg">
                    <item.icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-semibold text-base text-gray-800">{item.title}</h3>
                    <p className="text-xs text-gray-600 mt-1">{item.description}</p>
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
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide px-1">
            {t("common.administration")}
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {visibleAdminItems.map((item, index) => (
              <Card key={index} className="shadow-sm hover:shadow-md transition-shadow border-gray-200">
                <CardContent className="p-0">
                  <Button
                    onClick={item.onClick}
                    className="w-full h-auto p-4 justify-start bg-white hover:bg-gray-50 text-gray-800 border-0"
                    variant="ghost"
                  >
                    <div className="flex items-center gap-4 w-full">
                      <div className="bg-gray-100 p-2 rounded-lg">
                        <item.icon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="text-left flex-1">
                        <h3 className="font-semibold text-base text-gray-800">{item.title}</h3>
                        <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                      </div>
                    </div>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MainMenu;
