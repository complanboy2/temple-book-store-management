
import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const { currentUser, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="bg-gradient-to-r from-temple-saffron to-temple-gold py-4 px-4 shadow-md">
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
                  <h2 className="text-xl font-bold text-temple-maroon">Temple Book Manager</h2>
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
                        🏠 Dashboard
                      </Button>
                    </li>
                    <li>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-lg font-medium"
                        onClick={() => navigate("/books")}
                      >
                        📚 Books
                      </Button>
                    </li>
                    <li>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-lg font-medium"
                        onClick={() => navigate("/sales")}
                      >
                        💰 Sales
                      </Button>
                    </li>
                    {isAdmin && (
                      <>
                        <li>
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start text-lg font-medium"
                            onClick={() => navigate("/inventory")}
                          >
                            📦 Inventory
                          </Button>
                        </li>
                        <li>
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start text-lg font-medium"
                            onClick={() => navigate("/reports")}
                          >
                            📊 Reports
                          </Button>
                        </li>
                        <li>
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start text-lg font-medium"
                            onClick={() => navigate("/settings")}
                          >
                            ⚙️ Settings
                          </Button>
                        </li>
                      </>
                    )}
                  </ul>
                </nav>
                
                <div className="p-4 border-t border-temple-gold/30">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-temple-maroon text-temple-maroon hover:bg-temple-maroon/10"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <h1 className="text-xl font-bold text-white">Temple Book Manager</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="text-white">
            <Bell size={24} />
          </Button>
          <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-white">
            {currentUser?.name.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
