
import React from "react";
import { useNavigate } from "react-router-dom";
import MobileHeader from "@/components/MobileHeader";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Settings, User, Users, Store } from "lucide-react";
import { useStallContext } from "@/contexts/StallContext";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { currentUser, logout, isAdmin } = useAuth();
  const { stalls } = useStallContext();
  
  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  
  if (!currentUser) {
    navigate("/login");
    return null;
  }
  
  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader title="Profile" showBackButton={true} />
      
      <div className="mobile-container">
        <div className="flex flex-col items-center justify-center py-6">
          <div className="h-24 w-24 bg-temple-saffron rounded-full flex items-center justify-center text-white text-4xl font-bold mb-4">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-xl font-bold text-temple-maroon">{currentUser.name}</h2>
          <p className="text-gray-600">{currentUser.role === "admin" ? "Administrator" : "Sales Personnel"}</p>
          
          {currentUser.email && (
            <p className="text-sm text-gray-500 mt-1">{currentUser.email}</p>
          )}
        </div>
        
        <Card className="mobile-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-temple-maroon">Account Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-temple-gold/10">
                <span className="text-gray-500">Role</span>
                <span className="font-medium">{currentUser.role === "admin" ? "Administrator" : "Sales Personnel"}</span>
              </div>
              
              {currentUser.phone && (
                <div className="flex justify-between py-2 border-b border-temple-gold/10">
                  <span className="text-gray-500">Phone</span>
                  <span className="font-medium">{currentUser.phone}</span>
                </div>
              )}
              
              <div className="flex justify-between py-2 border-b border-temple-gold/10">
                <span className="text-gray-500">Permissions</span>
                <div className="text-right">
                  <div className={`text-sm ${currentUser.canSell ? "text-green-600" : "text-gray-400"}`}>
                    {currentUser.canSell ? "Can Sell Books" : "Cannot Sell Books"}
                  </div>
                  <div className={`text-sm ${currentUser.canRestock ? "text-green-600" : "text-gray-400"}`}>
                    {currentUser.canRestock ? "Can Restock Inventory" : "Cannot Restock Inventory"}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {isAdmin && (
          <Card className="mobile-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-temple-maroon">Administration</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/admin")}
                >
                  <Settings size={18} className="mr-2 text-temple-maroon" />
                  <span>Admin Panel</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/reports")}
                >
                  <Store size={18} className="mr-2 text-temple-maroon" />
                  <span>Sales Reports</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/admin")}
                >
                  <Users size={18} className="mr-2 text-temple-maroon" />
                  <span>Manage Personnel</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card className="mobile-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-temple-maroon">Settings</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/edit-profile")}
              >
                <User size={18} className="mr-2 text-temple-maroon" />
                <span>Edit Profile</span>
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                onClick={handleLogout}
              >
                <LogOut size={18} className="mr-2" />
                <span>Logout</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
