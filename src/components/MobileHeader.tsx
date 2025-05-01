
import React from "react";
import { Button } from "@/components/ui/button";
import { Bell, ChevronLeft, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import StallSelector from "@/components/StallSelector";

interface MobileHeaderProps {
  title: string;
  showBackButton?: boolean;
  backTo?: string;
  showSearchButton?: boolean;
  onSearch?: () => void;
  showStallSelector?: boolean;
  mediumBand?: boolean;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  showBackButton = false,
  backTo = "/",
  showSearchButton = false,
  onSearch,
  showStallSelector = false,
  mediumBand = true,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  return (
    <div>
      <div className="bg-gradient-to-r from-temple-saffron to-temple-gold py-4 px-4 flex items-center justify-between">
        <div className="flex items-center">
          {showBackButton && (
            <Button 
              variant="ghost" 
              size="icon"
              className="mr-2 text-white"
              onClick={() => navigate(backTo)}
            >
              <ChevronLeft size={24} />
            </Button>
          )}
          <h1 className="text-lg font-medium text-white">{title}</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          {showSearchButton && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white"
              onClick={onSearch}
            >
              <Search size={20} />
            </Button>
          )}
        </div>
      </div>
      
      {mediumBand && (
        <div className="bg-temple-maroon/80 py-2 px-4 text-center">
          <h2 className="text-sm font-medium text-white">{t("common.bookStoreManager")}</h2>
        </div>
      )}
      
      {showStallSelector && (
        <div className="py-2 px-4 bg-temple-background">
          <StallSelector />
        </div>
      )}
    </div>
  );
};

export default MobileHeader;
