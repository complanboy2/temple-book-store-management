
import React from "react";
import { useStallContext } from "@/contexts/StallContext";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";

const StallSelector: React.FC = () => {
  const { currentStore, stores, setCurrentStore } = useStallContext();
  const { t } = useTranslation();

  const handleStoreChange = (storeId: string) => {
    setCurrentStore(storeId);
  };

  // Check if stores exists and has length before rendering
  if (!stores || stores.length === 0) {
    return null;
  }

  return (
    <Select value={currentStore || ""} onValueChange={handleStoreChange}>
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
  );
};

export default StallSelector;
