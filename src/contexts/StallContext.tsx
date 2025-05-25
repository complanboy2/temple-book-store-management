
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
  shouldShowAddStore: boolean;
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
  const [shouldShowAddStore, setShouldShowAddStore] = useState(false);
  const { currentUser, isAuthenticated } = useAuth();

  const fetchStalls = async () => {
    if (!currentUser?.email || !isAuthenticated) {
      console.log("No authenticated user, skipping stall fetch");
      setStalls([]);
      setCurrentStore(null);
      setIsLoading(false);
      setShouldShowAddStore(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log("Fetching stalls for admin email:", currentUser.email);
      
      // Special handling for admin@temple.com - link them to existing data
      if (currentUser.email === 'admin@temple.com') {
        // First check if there are any stalls without admin_id and claim them
        const { data: unclaimedStalls } = await supabase
          .from("book_stalls")
          .select("*")
          .or("admin_id.is.null,admin_id.eq.''");

        if (unclaimedStalls && unclaimedStalls.length > 0) {
          console.log("Found unclaimed stalls, assigning to admin@temple.com");
          await supabase
            .from("book_stalls")
            .update({ admin_id: currentUser.email })
            .or("admin_id.is.null,admin_id.eq.''");
        }
      }
      
      const { data, error } = await supabase
        .from("book_stalls")
        .select("*")
        .eq("admin_id", currentUser.email)
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
        setShouldShowAddStore(false);
      } else {
        console.log("No stores found for user:", currentUser.email);
        setCurrentStore(null);
        // Show add store prompt for admins when they have no stores
        setShouldShowAddStore(true);
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
    if (!currentUser?.email) {
      throw new Error("User not authenticated or missing email");
    }

    try {
      console.log("Adding store:", { name, location, admin_id: currentUser.email, instituteid: currentUser.instituteId, is_default: isDefault });
      
      const { data, error } = await supabase
        .from("book_stalls")
        .insert({
          name,
          location: location || null,
          admin_id: currentUser.email,
          instituteid: currentUser.instituteId || 'default-institute',
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
        setShouldShowAddStore(false);
      }
      
      return data;
    } catch (error) {
      console.error("Error adding store:", error);
      throw error;
    }
  };

  const updateStoreDefault = async (storeId: string) => {
    if (!currentUser?.email) {
      throw new Error("User not authenticated");
    }

    try {
      const { error } = await supabase
        .from("book_stalls")
        .update({ is_default: true })
        .eq("id", storeId)
        .eq("admin_id", currentUser.email);

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
    if (isAuthenticated && currentUser?.email) {
      fetchStalls();
    } else {
      // Clear state when user is not authenticated
      setStalls([]);
      setCurrentStore(null);
      setIsLoading(false);
      setShouldShowAddStore(false);
    }
  }, [isAuthenticated, currentUser?.email]);

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
        shouldShowAddStore,
      }}
    >
      {children}
    </StallContext.Provider>
  );
};
