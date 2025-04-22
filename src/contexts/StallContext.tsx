
import React, { createContext, useContext, useState, useEffect } from "react";
import { BookStall } from "@/types";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

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

  useEffect(() => {
    if (currentUser) {
      const fetchStores = async () => {
        setIsLoading(true);
        try {
          const { data, error } = await supabase
            .from("book_stalls")
            .select("*")
            .order('createdat', { ascending: false });
          
          if (error) {
            console.error("Error fetching stores:", error);
            toast({
              title: "Error fetching stores",
              description: error.message,
              variant: "destructive",
            });
            setStores([]);
            setIsLoading(false);
            return;
          }
          
          // Safety check - ensure instituteid exists in the user object
          if (!currentUser.instituteId) {
            console.error("User has no institute ID");
            setStores([]);
            setIsLoading(false);
            return;
          }
          
          // Filter stores by the user's institute
          const filteredStores = data.filter(store => 
            store.instituteid === currentUser.instituteId
          );
          
          const mappedStores: BookStall[] = filteredStores.map(store => ({
            id: store.id,
            name: store.name,
            location: store.location || undefined,
            instituteId: store.instituteid,
            createdAt: new Date(store.createdat)
          }));
          
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
    } else {
      // Clear stores when user logs out
      setStores([]);
      setCurrentStoreState(null);
      localStorage.removeItem('currentStore');
    }
  }, [currentUser, isAdmin]);

  const setCurrentStore = (storeId: string) => {
    setCurrentStoreState(storeId);
    localStorage.setItem('currentStore', storeId);
  };

  const addStore = async (name: string, location?: string): Promise<BookStall | null> => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to add a store",
        variant: "destructive",
      });
      return null;
    }
    
    try {
      // Validate institute ID
      if (!currentUser.instituteId) {
        toast({
          title: "Institute Error",
          description: "No institute associated with your account",
          variant: "destructive",
        });
        return null;
      }
      
      const newStore = {
        name,
        location: location || null,
        instituteid: currentUser.instituteId,
        createdat: new Date().toISOString()
      };
      
      console.log("Creating new store with data:", newStore);
      
      const { data, error } = await supabase
        .from("book_stalls")
        .insert(newStore)
        .select()
        .single();
      
      if (error) {
        console.error("Error adding store:", error);
        toast({
          title: "Error adding store",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }
      
      console.log("Successfully added store:", data);
      
      const addedStore: BookStall = {
        id: data.id,
        name: data.name,
        location: data.location || undefined,
        instituteId: data.instituteid,
        createdAt: new Date(data.createdat)
      };
      
      setStores(prevStores => [addedStore, ...prevStores]);
      
      if (stores.length === 0) {
        setCurrentStore(addedStore.id);
      }
      
      toast({
        title: "Store Added",
        description: `${name} has been added successfully`,
      });
      
      return addedStore;
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
