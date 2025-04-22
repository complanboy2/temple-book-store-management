
import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Bell, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useStallContext } from "@/contexts/StallContext";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MobileHeaderProps {
  title: string;
  showBackButton?: boolean;
  showSearchButton?: boolean;
  showStallSelector?: boolean;
  onSearch?: () => void;
  backTo?: string; // New prop to specify where to navigate back to
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  showBackButton = true,
  showSearchButton = false,
  showStallSelector = false,
  onSearch,
  backTo,
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { currentStore, stores, setCurrentStore } = useStallContext();
  const { t } = useTranslation();
  
  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };
  
  return (
    <div className="sticky top-0 z-40 bg-temple-background border-b border-temple-gold/20 pt-safe">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center">
          {showBackButton && (
            <button
              onClick={handleBack}
              className="mr-2 p-1 rounded-full hover:bg-temple-gold/10"
            >
              <ArrowLeft size={24} className="text-temple-maroon" />
            </button>
          )}
          <h1 className="font-bold text-lg text-temple-maroon truncate max-w-[200px]">
            {title}
          </h1>
        </div>
        
        {showStallSelector && currentStore && stores.length > 0 && (
          <div className="flex-1 mx-2">
            <Select
              value={currentStore || "default-store"}
              onValueChange={(value) => setCurrentStore(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("common.selectStore")} />
              </SelectTrigger>
              <SelectContent>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <div className="flex items-center space-x-3">
          {showSearchButton && onSearch && (
            <button
              onClick={onSearch}
              className="p-1 rounded-full hover:bg-temple-gold/10"
            >
              <Search size={20} className="text-temple-maroon" />
            </button>
          )}
          
          <button className="p-1 rounded-full hover:bg-temple-gold/10">
            <Bell size={20} className="text-temple-maroon" />
          </button>
          
          <div 
            className="h-8 w-8 bg-temple-saffron rounded-full flex items-center justify-center text-white text-sm font-bold cursor-pointer"
            onClick={() => navigate("/profile")}
          >
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileHeader;
