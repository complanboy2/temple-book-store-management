
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Search } from "lucide-react";
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
  leftIcon?: React.ReactNode;
  onLeftIconClick?: () => void;
  rightContent?: React.ReactNode;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  showBackButton = false,
  backTo = "/",
  showSearchButton = false,
  onSearch,
  showStallSelector = false,
  mediumBand = false,
  leftIcon,
  onLeftIconClick,
  rightContent,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  return (
    <div>
      <div className="bg-gradient-to-r from-temple-saffron to-temple-gold py-3 px-4 flex items-center justify-between">
        <div className="flex items-center flex-1 min-w-0">
          {showBackButton && (
            <Button 
              variant="ghost" 
              size="icon"
              className="mr-2 text-white flex-shrink-0"
              onClick={() => navigate(backTo)}
            >
              <ChevronLeft size={24} />
            </Button>
          )}
          
          {leftIcon && !showBackButton && (
            <Button 
              variant="ghost" 
              size="icon"
              className="mr-2 text-white flex-shrink-0"
              onClick={onLeftIconClick}
            >
              {leftIcon}
            </Button>
          )}
          
          <h1 className="text-lg font-medium text-white truncate">{title}</h1>
        </div>
        
        <div className="flex items-center">
          {rightContent}
          {showSearchButton && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white flex-shrink-0"
              onClick={onSearch}
            >
              <Search size={20} />
            </Button>
          )}
        </div>
      </div>
      
      {showStallSelector && (
        <div className="py-2 px-4 bg-temple-background">
          <StallSelector />
        </div>
      )}
    </div>
  );
};

export default MobileHeader;
