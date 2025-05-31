
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import MobileHeader from "@/components/MobileHeader";
import MainMenu from "@/components/MainMenu";

const Index: React.FC = () => {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-temple-background">
      <MobileHeader title="Temple Book Stall" />
      
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-temple-maroon mb-2">
            Welcome, {currentUser?.name || "User"}!
          </h1>
          <p className="text-muted-foreground">
            Manage your temple book stall efficiently
          </p>
        </div>

        <MainMenu />
      </div>
    </div>
  );
};

export default Index;
