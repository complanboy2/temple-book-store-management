
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";

interface StallContextType {
  stores: Array<{ id: string; name: string; location?: string }>;
  currentStore: string | null;
  setCurrentStore: (storeId: string | null) => void;
  isLoading: boolean;
  bookStalls: Array<{ id: string; name: string; location?: string; is_default?: boolean }>;
  addStore: (name: string, location?: string) => Promise<void>;
  updateStoreDefault: (storeId: string) => Promise<void>;
}

const StallContext = createContext<StallContextType | undefined>(undefined);

export const useStallContext = () => {
  const context = useContext(StallContext);
  if (!context) {
    throw new Error("useStallContext must be used within a StallProvider");
  }
  return context;
};

export const StallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stores, setStores] = useState<Array<{ id: string; name: string; location?: string }>>([]);
  const [currentStore, setCurrentStore] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser, isAdmin } = useAuth();
  const { toast } = useToast();

  const fetchStalls = async () => {
    if (!currentUser?.email) {
      console.log("DEBUG: No current user email, skipping stall fetch");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    try {
      console.log("DEBUG: Fetching stalls for user:", currentUser.email, "Role:", currentUser.role);

      // Always query book_stalls table for all users
      const { data: stallsData, error: stallsError } = await supabase
        .from('book_stalls')
        .select('id, name, location, is_default')
        .order('name');

      if (stallsError) {
        console.error("DEBUG: Error fetching stalls:", stallsError);
        setStores([]);
      } else {
        console.log("DEBUG: Fetched stalls:", stallsData);
        const formattedStores = stallsData?.map(stall => ({
          id: stall.id,
          name: stall.name,
          location: stall.location || "",
          is_default: stall.is_default
        })) || [];
        
        setStores(formattedStores);
        
        if (formattedStores.length > 0 && !currentStore) {
          setCurrentStore(formattedStores[0].id);
        }
        
        console.log("DEBUG: Final stores state will be:", formattedStores);
      }
    } catch (error) {
      console.error("DEBUG: General error in fetchStalls:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addStore = async (name: string, location?: string) => {
    if (!currentUser?.email || !isAdmin) {
      throw new Error("Only admins can add stores");
    }

    const { data, error } = await supabase
      .from('book_stalls')
      .insert({
        name,
        location,
        admin_id: currentUser.email,
        instituteid: currentUser.instituteId || 'inst-1'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Refresh the stores list
    await fetchStalls();
  };

  const updateStoreDefault = async (storeId: string) => {
    if (!currentUser?.email || !isAdmin) {
      throw new Error("Only admins can update default store");
    }

    const { error } = await supabase
      .from('book_stalls')
      .update({ is_default: true })
      .eq('id', storeId)
      .eq('admin_id', currentUser.email);

    if (error) {
      throw error;
    }

    // Refresh the stores list
    await fetchStalls();
  };

  useEffect(() => {
    if (currentUser?.email) {
      fetchStalls();
    }
  }, [currentUser, isAdmin]);

  return (
    <StallContext.Provider value={{ 
      stores, 
      currentStore, 
      setCurrentStore, 
      isLoading,
      bookStalls: stores, // Alias for backward compatibility
      addStore,
      updateStoreDefault
    }}>
      {children}
    </StallContext.Provider>
  );
};
