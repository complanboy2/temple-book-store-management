import React, { createContext, useContext, useState, useEffect } from "react";
import { BookStall } from "@/types";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getBookStalls, setBookStalls } from "@/services/storageService";

interface StoreContextType {
  stores: BookStall[];
  currentStore: string | null;
  setCurrentStore: (storeId: string) => void;
  addStore: (name: string, location?: string) => Promise<BookStall | null>;
  updateStore: (id: string, data: Partial<BookStall>) => Promise<BookStall | null>;
  deleteStore: (id: string) => Promise<void>;
  isLoading: boolean;
  // For backward compatibility with components still using "stall" naming
  stalls: BookStall[];
  currentStall: string | null;
  setCurrentStall: (stallId: string) => void;
  addStall: (name: string, location?: string) => Promise<BookStall | null>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stores, setStores] = useState<BookStall[]>([]);
  const [currentStore, setCurrentStoreState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser, isAdmin } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchStores = async () => {
      setIsLoading(true);
      try {
        console.log("Fetching stalls for user:", currentUser);
        
        // First try to fetch from Supabase
        const { data, error } = await supabase
          .from("book_stalls")
          .select("*")
          .order('createdat', { ascending: false });
        
        if (error) {
          console.error("Error fetching stores from Supabase:", error);
          // Fall back to local storage if Supabase fails
          const localStores = getBookStalls();
          console.log("Falling back to local stores:", localStores);
          
          if (localStores.length > 0) {
            // Filter stores by the user's institute
            const filteredStores = currentUser?.instituteId 
              ? localStores.filter(store => store.instituteId === currentUser.instituteId)
              : localStores;
            
            setStores(filteredStores);
            
            const savedStore = localStorage.getItem('currentStore');
            if (savedStore && filteredStores.some(store => store.id === savedStore)) {
              setCurrentStoreState(savedStore);
            } else if (filteredStores.length > 0) {
              setCurrentStoreState(filteredStores[0].id);
              localStorage.setItem('currentStore', filteredStores[0].id);
            } else {
              setCurrentStoreState(null);
              localStorage.removeItem('currentStore');
            }
          }
        } else {
          console.log("Successfully fetched stores from Supabase:", data);
          
          // Filter stores by the user's institute if user has an instituteId
          const filteredStores = currentUser?.instituteId 
            ? data.filter(store => store.instituteid === currentUser.instituteId)
            : data;
          
          console.log("Filtered stores:", filteredStores);
          
          const mappedStores: BookStall[] = filteredStores.map(store => ({
            id: store.id,
            name: store.name,
            location: store.location || undefined,
            instituteId: store.instituteid,
            createdAt: new Date(store.createdat)
          }));
          
          // Update local storage with fetched stores
          setBookStalls(mappedStores);
          setStores(mappedStores);
          
          const savedStore = localStorage.getItem('currentStore');
          if (savedStore && mappedStores.some(store => store.id === savedStore)) {
            setCurrentStoreState(savedStore);
          } else if (mappedStores.length > 0) {
            setCurrentStoreState(mappedStores[0].id);
            localStorage.setItem('currentStore', mappedStores[0].id);
          } else {
            setCurrentStoreState(null);
            localStorage.removeItem('currentStore');
          }
        }
      } catch (err) {
        console.error("Failed to fetch stores:", err);
        toast({
          title: "Error",
          description: "Failed to fetch stores. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStores();
  }, [currentUser, isAdmin, toast]);

  const setCurrentStore = (storeId: string) => {
    setCurrentStoreState(storeId);
    localStorage.setItem('currentStore', storeId);
  };

  const addStore = async (name: string, location?: string): Promise<BookStall | null> => {
    try {
      // Validate institute ID for logged in users
      const instituteId = currentUser?.instituteId || "default";
      
      console.log("Adding store to Supabase:", { name, location, instituteId });
      
      // Create a unique ID for the store
      const storeId = crypto.randomUUID();
      
      // Try to save to Supabase first
      const { data, error } = await supabase
        .from("book_stalls")
        .insert([{
          id: storeId,
          name,
          location: location || null,
          instituteid: instituteId,
          createdat: new Date().toISOString()
        }])
        .select();
      
      if (error) {
        console.error("Error adding store to Supabase:", error);
        
        // Fall back to local storage only
        const newStore: BookStall = {
          id: storeId, 
          name,
          location,
          instituteId,
          createdAt: new Date()
        };
        
        const currentStores = getBookStalls();
        setBookStalls([...currentStores, newStore]);
        setStores(prevStores => [newStore, ...prevStores]);
        
        if (stores.length === 0) {
          setCurrentStore(newStore.id);
        }
        
        toast({
          title: "Store Added (Locally)",
          description: `${name} has been added to local storage only`,
          variant: "default",
        });
        
        return newStore;
      }
      
      console.log("Successfully added store to Supabase:", data);
      
      if (!data || data.length === 0) {
        console.error("No data returned from Supabase insert");
        return null;
      }
      
      // Map the response to our BookStall type
      const newStore: BookStall = {
        id: data[0].id,
        name: data[0].name,
        location: data[0].location || undefined,
        instituteId: data[0].instituteid,
        createdAt: new Date(data[0].createdat)
      };
      
      // Also save to local storage for offline support
      const currentStores = getBookStalls();
      setBookStalls([...currentStores, newStore]);
      
      // Update state
      setStores(prevStores => [newStore, ...prevStores]);
      
      if (stores.length === 0) {
        setCurrentStore(newStore.id);
      }
      
      toast({
        title: "Store Added",
        description: `${name} has been added successfully`,
        variant: "default",
      });
      
      return newStore;
    } catch (err: any) {
      console.error("Failed to add store:", err);
      toast({
        title: "Error",
        description: "Failed to add store. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateStore = async (id: string, data: Partial<BookStall>): Promise<BookStall | null> => {
    try {
      const updateData: any = {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.location !== undefined && { location: data.location }),
      };
      
      const { data: updatedStore, error } = await supabase
        .from("book_stalls")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      
      if (error) {
        console.error("Error updating store:", error);
        toast({
          title: "Error updating store",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }
      
      const mappedStore: BookStall = {
        id: updatedStore.id,
        name: updatedStore.name,
        location: updatedStore.location || undefined,
        instituteId: updatedStore.instituteid,
        createdAt: new Date(updatedStore.createdat)
      };
      
      setStores(prevStores => 
        prevStores.map(store => 
          store.id === id ? { ...store, ...data } : store
        )
      );
      
      toast({
        title: "Store Updated",
        description: `${updatedStore.name} has been updated`,
      });
      
      return mappedStore;
    } catch (err) {
      console.error("Failed to update store:", err);
      toast({
        title: "Error",
        description: "Failed to update store. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteStore = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from("book_stalls")
        .delete()
        .eq("id", id);
      
      if (error) {
        console.error("Error deleting store:", error);
        toast({
          title: "Error deleting store",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      setStores(prevStores => prevStores.filter(store => store.id !== id));
      
      if (currentStore === id) {
        const remaining = stores.filter(store => store.id !== id);
        if (remaining.length > 0) {
          setCurrentStore(remaining[0].id);
        } else {
          setCurrentStoreState(null);
          localStorage.removeItem('currentStore');
        }
      }
      
      toast({
        title: "Store Deleted",
        description: "Store has been removed successfully",
      });
    } catch (err) {
      console.error("Failed to delete store:", err);
      toast({
        title: "Error",
        description: "Failed to delete store. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <StoreContext.Provider 
      value={{ 
        stores, 
        currentStore, 
        setCurrentStore,
        addStore,
        updateStore,
        deleteStore,
        isLoading,
        stalls: stores,
        currentStall: currentStore,
        setCurrentStall: setCurrentStore,
        addStall: addStore
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStallContext = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStallContext must be used within a StallProvider");
  }
  return context;
};
