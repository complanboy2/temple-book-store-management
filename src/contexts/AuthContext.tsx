import React, { createContext, useContext, useEffect, useState } from "react";
import { User, UserRole } from "../types";
import { getCurrentUser, setCurrentUser, getUsers, setUsers, generateId } from "../services/storageService";
import { supabase } from "../integrations/supabase/client";

interface AuthContextType {
  currentUser: User | null;
  login: (emailOrPhone: string, password: string) => Promise<User>;
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

  // Initialize sample users with proper credentials
  const initializeUsers = () => {
    const users = getUsers();
    if (users.length === 0) {
      const defaultUsers: User[] = [
        {
          id: 'admin-user-id',
          name: 'Admin User',
          email: 'admin@temple.com',
          phone: '8885378147',
          role: 'admin',
          canRestock: true,
          canSell: true,
          instituteId: 'inst-1',
        },
        {
          id: generateId(),
          name: 'Seller 1',
          email: 'seller1@nampally.com',
          phone: '9989143572',
          role: 'personnel',
          canRestock: false,
          canSell: true,
          instituteId: 'inst-1',
        },
        {
          id: generateId(),
          name: 'Seller 2',
          email: 'seller2@nampally.com',
          phone: '8919032243',
          role: 'personnel',
          canRestock: false,
          canSell: true,
          instituteId: 'inst-1',
        },
        {
          id: generateId(),
          name: 'Seller 3',
          email: 'seller3@nampally.com',
          phone: '9100916479',
          role: 'personnel',
          canRestock: false,
          canSell: true,
          instituteId: 'inst-1',
        }
      ];
      setUsers(defaultUsers);
    } else {
      // Update existing admin user with phone number
      const updatedUsers = users.map(user => {
        if (user.email === 'admin@temple.com') {
          return { ...user, phone: '8885378147', id: 'admin-user-id' };
        }
        return user;
      });
      
      // Add missing seller users if they don't exist
      const missingUsers = [
        { email: 'seller1@nampally.com', phone: '9989143572', name: 'Seller 1' },
        { email: 'seller2@nampally.com', phone: '8919032243', name: 'Seller 2' },
        { email: 'seller3@nampally.com', phone: '9100916479', name: 'Seller 3' },
      ];
      
      missingUsers.forEach(({ email, phone, name }) => {
        if (!updatedUsers.some(u => u.email === email)) {
          updatedUsers.push({
            id: generateId(),
            name,
            email,
            phone,
            role: 'personnel',
            canRestock: false,
            canSell: true,
            instituteId: 'inst-1',
          });
        }
      });
      
      setUsers(updatedUsers);
    }
  };

  // Check for existing user session on load
  useEffect(() => {
    initializeUsers();
    
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

  // Enhanced login function that handles both email/phone and password
  const login = async (emailOrPhone: string, password: string): Promise<User> => {
    try {
      // First check if it's our super_admin from Supabase
      if (emailOrPhone === 'complanboy2@gmail.com') {
        const { data: supaUsers, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', emailOrPhone)
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
      let user = users.find(u => u.email === emailOrPhone || u.phone === emailOrPhone);
      
      // Check in Supabase users table as well
      if (!user) {
        const { data: supaUsers, error } = await supabase
          .from('users')
          .select('*')
          .or(`email.eq.${emailOrPhone},phone.eq.${emailOrPhone}`)
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
        // For demo purposes, accept any password for existing users
        // In production, you would verify the password here
        setUser(user);
        setCurrentUser(user);
        return user;
      } else {
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
