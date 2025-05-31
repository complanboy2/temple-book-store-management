import React, { createContext, useContext, useEffect, useState } from "react";
import { User, UserRole } from "../types";
import { getCurrentUser, setCurrentUser, getUsers, setUsers, generateId } from "../services/storageService";
import { supabase } from "../integrations/supabase/client";

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  register: (name: string, email: string, phone: string, password: string, role: UserRole, instituteId: string) => Promise<User>;
  inviteUser: (name: string, email: string, phone: string, role: UserRole) => Promise<string>;
  completeRegistration: (inviteCode: string, password: string) => Promise<User>;
  updateUserProfile: (user: User) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [invites, setInvites] = useState<Record<string, Partial<User>>>({});

  // Check for existing user session on load
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setUser(user);
    }
    
    // Load stored invites
    const storedInvites = localStorage.getItem('temple_invites');
    if (storedInvites) {
      setInvites(JSON.parse(storedInvites));
    }
    
    setIsLoading(false);
  }, []);

  // Enhanced login function that handles both Supabase and local users
  const login = async (email: string, password: string): Promise<User> => {
    try {
      // First check if it's our super_admin from Supabase
      if (email === 'complanboy2@gmail.com') {
        const { data: supaUsers, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single();

        if (supaUsers && !error) {
          const supaUser = {
            id: supaUsers.id,
            name: supaUsers.name,
            email: supaUsers.email,
            phone: supaUsers.phone || '',
            role: supaUsers.role as UserRole,
            canRestock: supaUsers.canrestock,
            canSell: supaUsers.cansell,
            instituteId: supaUsers.instituteid || 'inst-1',
          };
          
          setUser(supaUser);
          setCurrentUser(supaUser);
          return supaUser;
        }
      }

      // Then fall back to local storage users
      const users = getUsers();
      
      // Support both email and phone number login
      let user = users.find(u => u.email === email || u.phone === email);
      
      // Check in Supabase users table as well
      if (!user) {
        const { data: supaUsers, error } = await supabase
          .from('users')
          .select('*')
          .or(`email.eq.${email},phone.eq.${email}`)
          .single();

        if (supaUsers && !error) {
          user = {
            id: supaUsers.id,
            name: supaUsers.name,
            email: supaUsers.email,
            phone: supaUsers.phone || '',
            role: supaUsers.role as UserRole,
            canRestock: supaUsers.canrestock || false,
            canSell: supaUsers.cansell || false,
            instituteId: supaUsers.instituteid || 'inst-1',
          };
          
          // Add to local storage for future access
          const updatedUsers = [...users, user];
          setUsers(updatedUsers);
        }
      }
      
      if (user) {
        setUser(user);
        setCurrentUser(user);
        return user;
      } else {
        // For demo purposes, if user is admin@temple.com, create it with a specific ID
        if (email === 'admin@temple.com') {
          const newUser: User = {
            id: 'admin-user-id',
            name: 'Temple Admin',
            email: 'admin@temple.com',
            role: 'admin',
            canRestock: true,
            canSell: true,
            instituteId: 'inst-1',
          };
          
          const updatedUsers = [...users, newUser];
          setUsers(updatedUsers);
          setUser(newUser);
          setCurrentUser(newUser);
          return newUser;
        }
        
        throw new Error("Invalid credentials");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
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
  
  // Invite user function - creates an invite code
  const inviteUser = async (
    name: string,
    email: string,
    phone: string,
    role: UserRole
  ): Promise<string> => {
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can invite users");
    }

    const users = getUsers();
    const existingUser = users.find(u => u.email === email);
    
    if (existingUser) {
      throw new Error("User already exists");
    }
    
    const inviteCode = generateId();
    
    const inviteData = {
      name,
      email,
      phone,
      role,
      instituteId: currentUser.instituteId,
      invitedBy: currentUser.id,
      invitedAt: new Date(),
    };
    
    const updatedInvites = { ...invites, [inviteCode]: inviteData };
    setInvites(updatedInvites);
    localStorage.setItem('temple_invites', JSON.stringify(updatedInvites));
    
    return inviteCode;
  };
  
  // Complete registration with invite code
  const completeRegistration = async (inviteCode: string, password: string): Promise<User> => {
    if (!invites[inviteCode]) {
      throw new Error("Invalid invite code");
    }
    
    const inviteData = invites[inviteCode];
    
    if (!inviteData.name || !inviteData.email || !inviteData.role || !inviteData.instituteId) {
      throw new Error("Invalid invite data");
    }
    
    const newUser: User = {
      id: generateId(),
      name: inviteData.name,
      email: inviteData.email,
      phone: inviteData.phone || "",
      role: inviteData.role as UserRole,
      canRestock: inviteData.role === "admin",
      canSell: true,
      instituteId: inviteData.instituteId,
    };
    
    const users = getUsers();
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    
    const { [inviteCode]: _, ...remainingInvites } = invites;
    setInvites(remainingInvites);
    localStorage.setItem('temple_invites', JSON.stringify(remainingInvites));
    
    setUser(newUser);
    setCurrentUser(newUser);
    
    return newUser;
  };
  
  const logout = () => {
    setUser(null);
    setCurrentUser(null);
  };

  // Add the updateUserProfile function
  const updateUserProfile = (user: User) => {
    setUser(user);
    setCurrentUser(user);
  };

  const value = {
    currentUser,
    login,
    logout,
    register,
    inviteUser,
    completeRegistration,
    updateUserProfile,
    isAuthenticated: !!currentUser,
    isAdmin: currentUser?.role === "admin" || currentUser?.role === "super_admin",
    isLoading,
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
