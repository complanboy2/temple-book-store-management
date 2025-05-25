
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
    if (!currentUser?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("book_stalls")
        .select("*")
        .eq("instituteid", currentUser.id)
        .order('createdat', { ascending: false });

      if (error) {
        console.error("Error fetching stalls:", error);
        return;
      }

      setStalls(data || []);
      
      // Set current store to first available stall if not already set
      if (data && data.length > 0 && !currentStore) {
        setCurrentStore(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching stalls:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStalls = async () => {
    await fetchStalls();
  };

  const addStore = async (name: string, location?: string) => {
    if (!currentUser?.id) {
      throw new Error("User not authenticated");
    }

    try {
      const { data, error } = await supabase
        .from("book_stalls")
        .insert({
          name,
          location: location || null,
          instituteid: currentUser.id
        })
        .select()
        .single();

      if (error) {
        console.error("Error adding store:", error);
        throw error;
      }

      await refreshStalls();
      return data;
    } catch (error) {
      console.error("Error adding store:", error);
      throw error;
    }
  };

  useEffect(() => {
    fetchStalls();
  }, [currentUser?.id]);

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
