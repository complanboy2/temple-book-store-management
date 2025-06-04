
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

interface StallContextType {
  stores: Array<{ id: string; name: string; location?: string }>;
  currentStore: string | null;
  setCurrentStore: (storeId: string | null) => void;
  isLoading: boolean;
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

  const fetchStalls = async () => {
    if (!currentUser?.email) {
      console.log("DEBUG: No current user email, skipping stall fetch");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    try {
      console.log("DEBUG: Fetching stalls for user:", currentUser.email, "Role:", currentUser.role);

      if (isAdmin) {
        // For admins, fetch stores they created
        console.log("DEBUG: User is admin, fetching owned stores...");
        const { data: stallsData, error: stallsError } = await supabase
          .from('book_stalls')
          .select('id, name, location')
          .eq('admin_id', currentUser.email)
          .order('name');

        if (stallsError) {
          console.error("DEBUG: Error fetching admin stalls:", stallsError);
        } else {
          console.log("DEBUG: Fetched admin stalls:", stallsData);
          const formattedStores = stallsData?.map(stall => ({
            id: stall.id,
            name: stall.name,
            location: stall.location || ""
          })) || [];
          
          setStores(formattedStores);
          
          if (formattedStores.length > 0 && !currentStore) {
            setCurrentStore(formattedStores[0].id);
          }
        }
      } else {
        // For personnel/sellers, we need to find which admin created them
        console.log("DEBUG: User is personnel, checking created_by_admin...");
        
        // WORKAROUND: Get user data directly without RLS conflicts
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('created_by_admin')
          .eq('email', currentUser.email)
          .single();

        if (userError) {
          console.log("DEBUG: Error fetching user data:", userError);
          // Fallback: Try to find admin based on stored data or use currentUser info
          const adminEmail = currentUser.created_by_admin || currentUser.email;
          console.log("DEBUG: Using fallback admin email:", adminEmail);
          
          const { data: stallsData, error: stallsError } = await supabase
            .from('book_stalls')
            .select('id, name, location')
            .eq('admin_id', adminEmail)
            .order('name');

          if (!stallsError && stallsData) {
            console.log("DEBUG: Fetched stalls using fallback:", stallsData);
            const formattedStores = stallsData.map(stall => ({
              id: stall.id,
              name: stall.name,
              location: stall.location || ""
            }));
            
            setStores(formattedStores);
            
            if (formattedStores.length > 0 && !currentStore) {
              setCurrentStore(formattedStores[0].id);
            }
          }
        } else {
          console.log("DEBUG: Got user data:", userData);
          const adminEmail = userData.created_by_admin;
          
          if (adminEmail) {
            console.log("DEBUG: Querying stalls for admin_id:", adminEmail);
            const { data: stallsData, error: stallsError } = await supabase
              .from('book_stalls')
              .select('id, name, location')
              .eq('admin_id', adminEmail)
              .order('name');

            if (stallsError) {
              console.error("DEBUG: Error fetching personnel stalls:", stallsError);
            } else {
              console.log("DEBUG: Fetched personnel stalls:", stallsData);
              const formattedStores = stallsData?.map(stall => ({
                id: stall.id,
                name: stall.name,
                location: stall.location || ""
              })) || [];
              
              setStores(formattedStores);
              
              if (formattedStores.length > 0 && !currentStore) {
                setCurrentStore(formattedStores[0].id);
              }
            }
          }
        }
      }

      console.log("DEBUG: Fetched stores:", stores);
    } catch (error) {
      console.error("DEBUG: General error in fetchStalls:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.email) {
      fetchStalls();
    }
  }, [currentUser, isAdmin]);

  return (
    <StallContext.Provider value={{ stores, currentStore, setCurrentStore, isLoading }}>
      {children}
    </StallContext.Provider>
  );
};
