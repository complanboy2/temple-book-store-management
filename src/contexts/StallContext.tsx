
import React, { createContext, useContext, useState, useEffect } from "react";
import { BookStall } from "@/types";
import { getBookStalls, setBookStalls } from "@/services/storageService";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface StallContextType {
  bookStalls: BookStall[];
  setBookStalls: (stalls: BookStall[]) => void;
  currentStore: string | null;
  setCurrentStore: (storeId: string | null) => void;
  selectedStoreName: string | null;
  addBookStall: (name: string, location: string) => Promise<void>;
  updateBookStall: (id: string, name: string, location: string) => Promise<void>;
  deleteBookStall: (id: string) => Promise<void>;
  // Adding these properties to match what other components expect
  stores: BookStall[];
  addStore: (name: string, location: string) => Promise<void>;
  isLoading: boolean;
}

const StallContext = createContext<StallContextType>({
  bookStalls: [],
  setBookStalls: () => {},
  currentStore: null,
  setCurrentStore: () => {},
  selectedStoreName: null,
  addBookStall: async () => {},
  updateBookStall: async () => {},
  deleteBookStall: async () => {},
  // Adding these properties to match what other components expect
  stores: [],
  addStore: async () => {},
  isLoading: false,
});

export const useStallContext = () => useContext(StallContext);

export const StallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bookStalls, setBookStallsState] = useState<BookStall[]>([]);
  const [currentStore, setCurrentStore] = useState<string | null>(null);
  const [selectedStoreName, setSelectedStoreName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchBookStalls = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("book_stalls")
          .select("*");

        if (error) {
          throw error;
        }

        if (data && Array.isArray(data)) {
          const stalls: BookStall[] = data.map(item => ({
            id: item.id,
            name: item.name,
            location: item.location || undefined,
            instituteId: item.instituteid,
            createdAt: item.createdat ? new Date(item.createdat) : new Date()
          }));
          
          setBookStallsState(stalls);
          setBookStalls(stalls);
          
          console.log(`Loaded ${stalls.length} book stalls from Supabase`);
          
          if (stalls.length > 0 && !currentStore) {
            setCurrentStore(stalls[0].id);
            setSelectedStoreName(stalls[0].name);
          }
        }
      } catch (error) {
        console.error("Error fetching book stalls from Supabase:", error);
        
        const stalls = getBookStalls();
        setBookStallsState(stalls);
        
        if (stalls.length > 0 && !currentStore) {
          setCurrentStore(stalls[0].id);
          setSelectedStoreName(stalls[0].name);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookStalls();
  }, [currentUser]);

  useEffect(() => {
    if (currentStore) {
      const store = bookStalls.find((s) => s.id === currentStore);
      if (store) {
        setSelectedStoreName(store.name);
      }
    } else {
      setSelectedStoreName(null);
    }
  }, [currentStore, bookStalls]);

  const addBookStall = async (name: string, location: string) => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to add a book stall",
        variant: "destructive",
      });
      return;
    }

    try {
      const newBookStall: BookStall = {
        id: crypto.randomUUID(),
        name,
        location,
        instituteId: currentUser.instituteId,
        createdAt: new Date(),
      };

      const updatedStalls = [...bookStalls, newBookStall];
      setBookStallsState(updatedStalls);
      setBookStalls(updatedStalls);

      // First insert into Supabase
      try {
        const { error } = await supabase
          .from("book_stalls")
          .insert({
            id: newBookStall.id,
            name: newBookStall.name,
            location: newBookStall.location,
            instituteid: newBookStall.instituteId,
            createdat: newBookStall.createdAt.toISOString(),
          });

        if (error) {
          console.error("Error adding book stall to Supabase:", error);
          toast({
            title: "Warning",
            description: "Book stall saved locally but not synced with server",
            variant: "default",
          });
        } else {
          toast({
            title: "Success",
            description: "Book stall added successfully",
          });
        }
      } catch (error) {
        console.error("Exception adding book stall to Supabase:", error);
        toast({
          title: "Warning",
          description: "Book stall saved locally but not synced with server",
          variant: "default",
        });
      }

      if (updatedStalls.length === 1) {
        setCurrentStore(newBookStall.id);
        setSelectedStoreName(newBookStall.name);
      }
    } catch (error) {
      console.error("Error adding book stall:", error);
      toast({
        title: "Error",
        description: "Failed to add book stall",
        variant: "destructive",
      });
    }
  };

  const updateBookStall = async (id: string, name: string, location: string) => {
    try {
      const stallIndex = bookStalls.findIndex((s) => s.id === id);
      if (stallIndex === -1) return;

      const updatedStall = {
        ...bookStalls[stallIndex],
        name,
        location,
      };

      const updatedStalls = [...bookStalls];
      updatedStalls[stallIndex] = updatedStall;
      setBookStallsState(updatedStalls);
      setBookStalls(updatedStalls);

      if (currentStore === id) {
        setSelectedStoreName(name);
      }

      try {
        const { error } = await supabase
          .from("book_stalls")
          .update({
            name: updatedStall.name,
            location: updatedStall.location,
          })
          .eq("id", id);

        if (error) {
          console.error("Error updating book stall in Supabase:", error);
          toast({
            title: "Warning",
            description: "Book stall updated locally but not synced with server",
            variant: "default",
          });
        } else {
          toast({
            title: "Success",
            description: "Book stall updated successfully",
          });
        }
      } catch (error) {
        console.error("Exception updating book stall in Supabase:", error);
        toast({
          title: "Warning",
          description: "Book stall updated locally but not synced with server",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error updating book stall:", error);
      toast({
        title: "Error",
        description: "Failed to update book stall",
        variant: "destructive",
      });
    }
  };

  const deleteBookStall = async (id: string) => {
    try {
      const updatedStalls = bookStalls.filter((s) => s.id !== id);
      setBookStallsState(updatedStalls);
      setBookStalls(updatedStalls);

      if (currentStore === id) {
        const newCurrentStore = updatedStalls.length > 0 ? updatedStalls[0].id : null;
        const newStoreName = updatedStalls.length > 0 ? updatedStalls[0].name : null;
        setCurrentStore(newCurrentStore);
        setSelectedStoreName(newStoreName);
      }

      try {
        const { error } = await supabase
          .from("book_stalls")
          .delete()
          .eq("id", id);

        if (error) {
          console.error("Error deleting book stall from Supabase:", error);
          toast({
            title: "Warning",
            description: "Book stall deleted locally but not synced with server",
            variant: "default",
          });
        } else {
          toast({
            title: "Success",
            description: "Book stall deleted successfully",
          });
        }
      } catch (error) {
        console.error("Exception deleting book stall from Supabase:", error);
        toast({
          title: "Warning",
          description: "Book stall deleted locally but not synced with server",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error deleting book stall:", error);
      toast({
        title: "Error",
        description: "Failed to delete book stall",
        variant: "destructive",
      });
    }
  };

  return (
    <StallContext.Provider
      value={{
        bookStalls,
        setBookStalls: setBookStallsState,
        currentStore,
        setCurrentStore,
        selectedStoreName,
        addBookStall,
        updateBookStall,
        deleteBookStall,
        // Adding aliases to match what other components expect
        stores: bookStalls,
        addStore: addBookStall,
        isLoading,
      }}
    >
      {children}
    </StallContext.Provider>
  );
};
