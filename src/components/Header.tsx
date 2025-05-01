
import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Header = () => {
  const { currentUser, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <header className="bg-gradient-to-r from-temple-saffron to-temple-gold py-4 px-4 shadow-md sticky top-0 z-40">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white">
                  <Menu size={24} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-temple-background">
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-temple-gold/30">
                    <h2 className="text-xl font-bold text-temple-maroon">{t("common.templeBookStall")}</h2>
                    {currentUser && (
                      <p className="text-sm text-muted-foreground mt-1">{currentUser.name}</p>
                    )}
                  </div>
                  
                  <nav className="flex-1 py-4">
                    <ul className="space-y-1">
                      <li>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start text-lg font-medium"
                          onClick={() => navigate("/")}
                        >
                          🏠 {t("common.home")}
                        </Button>
                      </li>
                      <li>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start text-lg font-medium"
                          onClick={() => navigate("/books")}
                        >
                          📚 {t("common.books")}
                        </Button>
                      </li>
                      <li>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start text-lg font-medium"
                          onClick={() => navigate("/sell/new")}
                        >
                          💰 {t("common.newSale")}
                        </Button>
                      </li>
                      <li>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start text-lg font-medium"
                          onClick={() => navigate("/sales")}
                        >
                          💰 {t("common.sales")}
                        </Button>
                      </li>
                      <li>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start text-lg font-medium"
                          onClick={() => navigate("/orders")}
                        >
                          📦 {t("common.orders")}
                        </Button>
                      </li>
                      {isAdmin && (
                        <>
                          <li>
                            <Button 
                              variant="ghost" 
                              className="w-full justify-start text-lg font-medium"
                              onClick={() => navigate("/reports")}
                            >
                              📊 {t("common.reports")}
                            </Button>
                          </li>
                          <li>
                            <Button 
                              variant="ghost" 
                              className="w-full justify-start text-lg font-medium"
                              onClick={() => navigate("/admin")}
                            >
                              ⚙️ {t("common.administration")}
                            </Button>
                          </li>
                          <li>
                            <Button 
                              variant="ghost" 
                              className="w-full justify-start text-lg font-medium"
                              onClick={() => navigate("/settings")}
                            >
                              ⚙️ {t("common.settings")}
                            </Button>
                          </li>
                        </>
                      )}
                      <li>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start text-lg font-medium"
                          onClick={() => navigate("/privacy-policy")}
                        >
                          📜 {t("common.privacyPolicy")}
                        </Button>
                      </li>
                    </ul>
                  </nav>
                  
                  <div className="p-4 border-t border-temple-gold/30">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start border-temple-maroon text-temple-maroon hover:bg-temple-maroon/10"
                      onClick={handleLogout}
                    >
                      {t("common.logout")}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <h1 className="text-xl font-bold text-white" onClick={() => navigate("/")}>{t("common.templeBookStall")}</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white"
              onClick={() => navigate("/notifications")}
            >
              <Bell size={24} />
            </Button>
            <div 
              className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-white cursor-pointer"
              onClick={() => navigate("/profile")}
            >
              {currentUser?.name?.charAt(0).toUpperCase() || "U"}
            </div>
          </div>
        </div>
      </header>
      <div className="bg-temple-maroon/80 py-2 px-4 text-center">
        <h2 className="text-sm font-medium text-white">{t("common.bookStoreManager")}</h2>
      </div>
    </>
  );
};

export default Header;
