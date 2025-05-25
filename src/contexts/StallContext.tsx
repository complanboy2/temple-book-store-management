
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface StallContextType {
  stalls: any[];
  stores: any[]; // Alias for stalls for backward compatibility
  currentStore: string | null;
  setCurrentStore: (storeId: string) => void;
  isLoading: boolean;
  refreshStalls: () => Promise<void>;
  addStore: (name: string, location?: string, isDefault?: boolean) => Promise<any>;
  updateStoreDefault: (storeId: string) => Promise<void>;
  bookStalls: any[]; // Alias for stalls for backward compatibility
}

const StallContext = createContext<StallContextType | undefined>(undefined);

export const useStallContext = () => {
  const context = useContext(StallContext);
  if (!context) {
    throw new Error("useStallContext must be used within a StallProvider");
  }
  return context;
};

interface StallProviderProps {
  children: ReactNode;
}

export const StallProvider: React.FC<StallProviderProps> = ({ children }) => {
  const [stalls, setStalls] = useState<any[]>([]);
  const [currentStore, setCurrentStore] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser, isAuthenticated } = useAuth();

  const fetchStalls = async () => {
    if (!currentUser?.id || !isAuthenticated) {
      console.log("No authenticated user, skipping stall fetch");
      setStalls([]);
      setCurrentStore(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log("Fetching stalls for user ID:", currentUser.id);
      
      const { data, error } = await supabase
        .from("book_stalls")
        .select("*")
        .eq("admin_id", currentUser.id)
        .order('createdat', { ascending: false });

      if (error) {
        console.error("Error fetching stalls:", error);
        setStalls([]);
        setIsLoading(false);
        return;
      }

      console.log("Fetched stalls:", data);
      setStalls(data || []);
      
      // Set current store to default store if available, otherwise first store
      if (data && data.length > 0) {
        const defaultStore = data.find(store => store.is_default);
        const selectedStore = defaultStore || data[0];
        setCurrentStore(selectedStore.id);
        console.log("Set current store to:", selectedStore.id);
      } else {
        console.log("No stores found for user:", currentUser.id);
        setCurrentStore(null);
      }
    } catch (error) {
      console.error("Error fetching stalls:", error);
      setStalls([]);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStalls = async () => {
    await fetchStalls();
  };

  const addStore = async (name: string, location?: string, isDefault?: boolean) => {
    if (!currentUser?.id) {
      throw new Error("User not authenticated or missing user ID");
    }

    try {
      console.log("Adding store:", { name, location, admin_id: currentUser.id, instituteid: currentUser.instituteId, is_default: isDefault });
      
      const { data, error } = await supabase
        .from("book_stalls")
        .insert({
          name,
          location: location || null,
          admin_id: currentUser.id,
          instituteid: currentUser.instituteId,
          is_default: isDefault || false
        })
        .select()
        .single();

      if (error) {
        console.error("Error adding store:", error);
        throw error;
      }

      console.log("Store added successfully:", data);
      await refreshStalls();
      
      // Set the newly created store as current store
      if (data) {
        setCurrentStore(data.id);
      }
      
      return data;
    } catch (error) {
      console.error("Error adding store:", error);
      throw error;
    }
  };

  const updateStoreDefault = async (storeId: string) => {
    if (!currentUser?.id) {
      throw new Error("User not authenticated");
    }

    try {
      const { error } = await supabase
        .from("book_stalls")
        .update({ is_default: true })
        .eq("id", storeId)
        .eq("admin_id", currentUser.id);

      if (error) {
        console.error("Error updating default store:", error);
        throw error;
      }

      await refreshStalls();
    } catch (error) {
      console.error("Error updating default store:", error);
      throw error;
    }
  };

  // Only fetch stalls when user is authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser?.id) {
      fetchStalls();
    } else {
      // Clear state when user is not authenticated
      setStalls([]);
      setCurrentStore(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, currentUser?.id]);

  return (
    <StallContext.Provider
      value={{
        stalls,
        stores: stalls, // Alias for backward compatibility
        currentStore,
        setCurrentStore,
        isLoading,
        refreshStalls,
        addStore,
        updateStoreDefault,
        bookStalls: stalls, // Alias for backward compatibility
      }}
    >
      {children}
    </StallContext.Provider>
  );
};
