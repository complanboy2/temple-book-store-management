
import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Bell, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useStallContext } from "@/contexts/StallContext";

interface MobileHeaderProps {
  title: string;
  showBackButton?: boolean;
  showSearchButton?: boolean;
  showStallSelector?: boolean;
  onSearch?: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  showBackButton = true,
  showSearchButton = false,
  showStallSelector = false,
  onSearch,
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { currentStall, stalls, setCurrentStall } = useStallContext();
  
  const handleStallChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stallId = e.target.value;
    setCurrentStall(stallId);
  };
  
  return (
    <div className="sticky top-0 z-40 bg-temple-background border-b border-temple-gold/20 pt-safe">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center">
          {showBackButton && (
            <button
              onClick={() => navigate(-1)}
              className="mr-2 p-1 rounded-full hover:bg-temple-gold/10"
            >
              <ArrowLeft size={24} className="text-temple-maroon" />
            </button>
          )}
          <h1 className="font-bold text-lg text-temple-maroon truncate max-w-[200px]">
            {title}
          </h1>
        </div>
        
        {showStallSelector && currentStall && stalls.length > 0 && (
          <div className="flex-1 mx-2">
            <select 
              className="stall-selector w-full"
              value={currentStall}
              onChange={handleStallChange}
            >
              {stalls.map((stall) => (
                <option key={stall.id} value={stall.id}>
                  {stall.name}
                </option>
              ))}
            </select>
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
            className="h-8 w-8 bg-temple-saffron rounded-full flex items-center justify-center text-white text-sm font-bold"
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
