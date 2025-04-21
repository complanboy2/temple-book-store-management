
import React, { createContext, useContext, useEffect, useState } from "react";
import { User, UserRole } from "../types";
import { getCurrentUser, setCurrentUser, getUsers, setUsers, generateId } from "../services/storageService";

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  register: (name: string, email: string, phone: string, password: string, role: UserRole, instituteId: string) => Promise<User>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing user session on load
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setUser(user);
    }
    setIsLoading(false);
  }, []);

  // Mock login function
  const login = async (email: string, password: string): Promise<User> => {
    return new Promise((resolve, reject) => {
      const users = getUsers();
      const user = users.find(u => u.email === email);
      
      if (user) {
        // In a real app, we would verify the password here
        setUser(user);
        setCurrentUser(user);
        resolve(user);
      } else {
        reject(new Error("Invalid credentials"));
      }
    });
  };
  
  // Mock register function
  const register = async (
    name: string, 
    email: string, 
    phone: string, 
    password: string, 
    role: UserRole, 
    instituteId: string
  ): Promise<User> => {
    return new Promise((resolve, reject) => {
      const users = getUsers();
      const existingUser = users.find(u => u.email === email);
      
      if (existingUser) {
        reject(new Error("User already exists"));
      } else {
        const newUser: User = {
          id: generateId(),
          name,
          email,
          phone,
          role,
          canRestock: role === "admin",
          canSell: true,
          instituteId,
        };
        
        const updatedUsers = [...users, newUser];
        setUsers(updatedUsers);
        setUser(newUser);
        setCurrentUser(newUser);
        resolve(newUser);
      }
    });
  };
  
  const logout = () => {
    setUser(null);
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    login,
    logout,
    register,
    isAuthenticated: !!currentUser,
    isAdmin: currentUser?.role === "admin",
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
