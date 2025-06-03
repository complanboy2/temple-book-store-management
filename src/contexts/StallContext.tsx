import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface StallContextType {
  stalls: any[];
  stores: any[];
  currentStore: string | null;
  setCurrentStore: (storeId: string) => void;
  isLoading: boolean;
  refreshStalls: () => Promise<void>;
  addStore: (name: string, location?: string, isDefault?: boolean) => Promise<any>;
  updateStoreDefault: (storeId: string) => Promise<void>;
  bookStalls: any[];
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
      console.log("Fetching stalls for user:", currentUser.email, "Role:", currentUser.role);
      
      let adminEmail = currentUser.email;
      
      // If user is personnel, find the admin who created them
      if (currentUser.role === "personnel") {
        console.log("User is personnel, checking created_by_admin...");
        
        // First get the user's created_by_admin value
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("created_by_admin")
          .eq("email", currentUser.email)
          .single();
        
        if (userError) {
          console.error("Error fetching user data:", userError);
        } else if (userData?.created_by_admin) {
          console.log("Found created_by_admin:", userData.created_by_admin);
          adminEmail = userData.created_by_admin;
        } else {
          console.log("No created_by_admin found, trying fallback to admin@temple.com");
          // Fallback: try admin@temple.com
          adminEmail = "admin@temple.com";
        }
      }

      console.log("Querying stalls for admin_id:", adminEmail);
      
      const { data, error } = await supabase
        .from("book_stalls")
        .select("*")
        .eq("admin_id", adminEmail)
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
        console.log("Set current store to:", selectedStore.id, selectedStore.name);
        setShouldShowAddStore(false);
      } else {
        console.log("No stores found for admin:", adminEmail);
        setCurrentStore(null);
        // Only show add store prompt for admins when they have no stores
        setShouldShowAddStore(currentUser.role === "admin");
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
  }, [isAuthenticated, currentUser?.email, currentUser?.role]);

  return (
    <StallContext.Provider
      value={{
        stalls,
        stores: stalls,
        currentStore,
        setCurrentStore,
        isLoading,
        refreshStalls,
        addStore,
        updateStoreDefault,
        bookStalls: stalls,
        shouldShowAddStore,
      }}
    >
      {children}
    </StallContext.Provider>
  );
};
