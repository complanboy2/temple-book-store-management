
import React, { createContext, useContext, useState, useEffect } from "react";
import { BookStall } from "@/types";
import { useAuth } from "./AuthContext";
import { getBookStalls } from "@/services/storageService";

interface StallContextType {
  stalls: BookStall[];
  currentStall: string | null;
  setCurrentStall: (stallId: string) => void;
  addStall: (name: string, location?: string) => Promise<BookStall>;
  updateStall: (id: string, data: Partial<BookStall>) => Promise<BookStall>;
  deleteStall: (id: string) => Promise<void>;
}

const StallContext = createContext<StallContextType | undefined>(undefined);

export const StallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stalls, setStalls] = useState<BookStall[]>([]);
  const [currentStall, setCurrentStallState] = useState<string | null>(null);
  const { currentUser, isAdmin } = useAuth();

  // Fetch stalls on mount and when current user changes
  useEffect(() => {
    if (currentUser) {
      const fetchStalls = () => {
        const allStalls = getBookStalls();
        // If admin, can see all stalls from their institute
        // If not admin, can only see stalls they are assigned to
        const filteredStalls = isAdmin 
          ? allStalls.filter(stall => stall.instituteId === currentUser.instituteId)
          : allStalls.filter(stall => stall.instituteId === currentUser.instituteId);
        
        setStalls(filteredStalls);
        
        // Set current stall to the first one if not already set
        if (filteredStalls.length > 0 && !currentStall) {
          setCurrentStallState(filteredStalls[0].id);
          localStorage.setItem('currentStall', filteredStalls[0].id);
        }
      };
      
      fetchStalls();
      
      // Check if there's a saved stall in localStorage
      const savedStall = localStorage.getItem('currentStall');
      if (savedStall) {
        setCurrentStallState(savedStall);
      }
    }
  }, [currentUser, isAdmin]);

  const setCurrentStall = (stallId: string) => {
    setCurrentStallState(stallId);
    localStorage.setItem('currentStall', stallId);
  };

  const addStall = async (name: string, location?: string): Promise<BookStall> => {
    if (!currentUser) throw new Error("User not authenticated");
    
    const { generateId, setBookStalls } = await import("@/services/storageService");
    
    const newStall: BookStall = {
      id: generateId(),
      name,
      location,
      instituteId: currentUser.instituteId,
      createdAt: new Date(),
    };
    
    const updatedStalls = [...stalls, newStall];
    setStalls(updatedStalls);
    setBookStalls(updatedStalls);
    
    return newStall;
  };

  const updateStall = async (id: string, data: Partial<BookStall>): Promise<BookStall> => {
    const { setBookStalls } = await import("@/services/storageService");
    
    const stallIndex = stalls.findIndex(stall => stall.id === id);
    if (stallIndex === -1) throw new Error("Stall not found");
    
    const updatedStall = { ...stalls[stallIndex], ...data };
    const updatedStalls = [...stalls];
    updatedStalls[stallIndex] = updatedStall;
    
    setStalls(updatedStalls);
    setBookStalls(updatedStalls);
    
    return updatedStall;
  };

  const deleteStall = async (id: string): Promise<void> => {
    const { setBookStalls } = await import("@/services/storageService");
    
    const updatedStalls = stalls.filter(stall => stall.id !== id);
    setStalls(updatedStalls);
    setBookStalls(updatedStalls);
    
    // If deleting current stall, switch to another one if available
    if (currentStall === id && updatedStalls.length > 0) {
      setCurrentStall(updatedStalls[0].id);
    }
  };

  return (
    <StallContext.Provider 
      value={{ 
        stalls, 
        currentStall, 
        setCurrentStall,
        addStall,
        updateStall,
        deleteStall
      }}
    >
      {children}
    </StallContext.Provider>
  );
};

export const useStallContext = () => {
  const context = useContext(StallContext);
  if (context === undefined) {
    throw new Error("useStallContext must be used within a StallProvider");
  }
  return context;
};
