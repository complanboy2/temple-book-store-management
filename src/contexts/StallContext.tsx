
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
  addStore: (name: string, location?: string) => Promise<any>;
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
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();

  const fetchStalls = async () => {
    if (!currentUser?.instituteId) {
      console.log("No instituteId found for current user:", currentUser);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log("Fetching stalls for instituteId:", currentUser.instituteId);
      
      const { data, error } = await supabase
        .from("book_stalls")
        .select("*")
        .eq("instituteid", currentUser.instituteId)
        .order('createdat', { ascending: false });

      if (error) {
        console.error("Error fetching stalls:", error);
        setStalls([]);
        setIsLoading(false);
        return;
      }

      console.log("Fetched stalls:", data);
      setStalls(data || []);
      
      // Set current store to first available stall if not already set
      if (data && data.length > 0 && !currentStore) {
        setCurrentStore(data[0].id);
        console.log("Set current store to:", data[0].id);
      } else if (!data || data.length === 0) {
        console.log("No stores found for institute:", currentUser.instituteId);
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

  const addStore = async (name: string, location?: string) => {
    if (!currentUser?.instituteId) {
      throw new Error("User not authenticated or missing instituteId");
    }

    try {
      console.log("Adding store:", { name, location, instituteId: currentUser.instituteId });
      
      const { data, error } = await supabase
        .from("book_stalls")
        .insert({
          name,
          location: location || null,
          instituteid: currentUser.instituteId
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

  useEffect(() => {
    if (currentUser?.instituteId) {
      fetchStalls();
    }
  }, [currentUser?.instituteId]);

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
        bookStalls: stalls, // Alias for backward compatibility
      }}
    >
      {children}
    </StallContext.Provider>
  );
};
