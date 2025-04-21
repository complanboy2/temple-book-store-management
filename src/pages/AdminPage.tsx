
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users, BookOpen, BarChart2, Settings } from "lucide-react";
import MobileHeader from "@/components/MobileHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useStallContext } from "@/contexts/StallContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

const AdminPage = () => {
  const navigate = useNavigate();
  const { isAdmin, inviteUser } = useAuth();
  const { stalls, addStall } = useStallContext();
  const { toast } = useToast();
  const [isAddStallOpen, setIsAddStallOpen] = useState(false);
  const [isInviteUserOpen, setIsInviteUserOpen] = useState(false);
  const [newStallName, setNewStallName] = useState("");
  const [newStallLocation, setNewStallLocation] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "personnel">("personnel");
  const [inviteCode, setInviteCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAdmin) {
    navigate("/");
    return null;
  }

  const handleAddStall = async () => {
    if (!newStallName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a stall name",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addStall(newStallName, newStallLocation);
      toast({
        title: "Success",
        description: "Stall added successfully",
      });
      setNewStallName("");
      setNewStallLocation("");
      setIsAddStallOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add stall",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteName.trim() || !inviteEmail.trim() || !invitePhone.trim()) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const code = await inviteUser(inviteName, inviteEmail, invitePhone, inviteRole);
      setInviteCode(code);
      toast({
        title: "Success",
        description: "User invited successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to invite user",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateWhatsAppLink = (code: string) => {
    const signupUrl = `${window.location.origin}/complete-signup/${code}`;
    const message = `You've been invited to join Temple Book Sutra. Click this link to complete your registration: ${signupUrl}`;
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  };

  const copyInviteLink = (code: string) => {
    const signupUrl = `${window.location.origin}/complete-signup/${code}`;
    navigator.clipboard.writeText(signupUrl);
    toast({
      title: "Copied",
      description: "Invite link copied to clipboard",
    });
  };

  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader title="Admin Panel" showBackButton={true} />

      <div className="mobile-container">
        <div className="grid grid-cols-1 gap-4 mt-4">
          {/* Stalls section */}
          <div className="mobile-card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="mobile-header">Book Stalls</h2>
              <Dialog open={isAddStallOpen} onOpenChange={setIsAddStallOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-temple-saffron hover:bg-temple-saffron/90">
                    <Plus size={16} className="mr-1" /> Add Stall
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Book Stall</DialogTitle>
                    <DialogDescription>
                      Create a new book stall for your temple or organization.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label htmlFor="stallName" className="text-sm font-medium">
                        Stall Name *
                      </label>
                      <Input
                        id="stallName"
                        placeholder="Main Book Stall"
                        value={newStallName}
                        onChange={(e) => setNewStallName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="stallLocation" className="text-sm font-medium">
                        Location (Optional)
                      </label>
                      <Input
                        id="stallLocation"
                        placeholder="Temple Entrance"
                        value={newStallLocation}
                        onChange={(e) => setNewStallLocation(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddStallOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      className="bg-temple-saffron hover:bg-temple-saffron/90"
                      onClick={handleAddStall}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Adding..." : "Add Stall"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {stalls.length > 0 ? (
              <div className="space-y-3">
                {stalls.map((stall) => (
                  <div key={stall.id} className="border border-temple-gold/20 rounded-lg p-3 bg-white shadow-sm">
                    <h3 className="font-medium text-temple-maroon">{stall.name}</h3>
                    {stall.location && <p className="text-sm text-gray-600">{stall.location}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-temple-gold/40 rounded-lg">
                <p className="text-gray-500">No book stalls added yet</p>
                <Button 
                  className="mt-2 bg-temple-saffron hover:bg-temple-saffron/90"
                  size="sm"
                  onClick={() => setIsAddStallOpen(true)}
                >
                  <Plus size={16} className="mr-1" /> Add Your First Stall
                </Button>
              </div>
            )}
          </div>

          {/* Invite users section */}
          <div className="mobile-card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="mobile-header">Invite Users</h2>
              <Dialog open={isInviteUserOpen} onOpenChange={setIsInviteUserOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-temple-maroon hover:bg-temple-maroon/90">
                    <Plus size={16} className="mr-1" /> Invite
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite New User</DialogTitle>
                    <DialogDescription>
                      Send an invitation to a new personnel or admin.
                    </DialogDescription>
                  </DialogHeader>
                  {!inviteCode ? (
                    <>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <label htmlFor="inviteName" className="text-sm font-medium">
                            Name *
                          </label>
                          <Input
                            id="inviteName"
                            placeholder="John Doe"
                            value={inviteName}
                            onChange={(e) => setInviteName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="inviteEmail" className="text-sm font-medium">
                            Email *
                          </label>
                          <Input
                            id="inviteEmail"
                            type="email"
                            placeholder="john@example.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="invitePhone" className="text-sm font-medium">
                            Phone Number *
                          </label>
                          <Input
                            id="invitePhone"
                            placeholder="+91 9876543210"
                            value={invitePhone}
                            onChange={(e) => setInvitePhone(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="inviteRole" className="text-sm font-medium">
                            Role *
                          </label>
                          <select
                            id="inviteRole"
                            className="stall-selector w-full"
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value as "admin" | "personnel")}
                          >
                            <option value="personnel">Personnel (Sales Only)</option>
                            <option value="admin">Admin (Full Access)</option>
                          </select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsInviteUserOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          className="bg-temple-maroon hover:bg-temple-maroon/90"
                          onClick={handleInviteUser}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Generating Invite..." : "Generate Invite"}
                        </Button>
                      </DialogFooter>
                    </>
                  ) : (
                    <>
                      <div className="space-y-4 py-4">
                        <div className="text-center">
                          <p className="font-medium text-temple-maroon">Invite Created!</p>
                          <p className="text-sm mt-2">Share this link with {inviteName} via WhatsApp:</p>
                        </div>
                        <div className="p-3 bg-gray-100 rounded-md text-sm break-all">
                          {`${window.location.origin}/complete-signup/${inviteCode}`}
                        </div>
                      </div>
                      <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button
                          className="w-full sm:w-auto"
                          variant="outline"
                          onClick={() => copyInviteLink(inviteCode)}
                        >
                          Copy Link
                        </Button>
                        <Button
                          className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                          onClick={() => window.open(generateWhatsAppLink(inviteCode), '_blank')}
                        >
                          Share via WhatsApp
                        </Button>
                        <Button
                          className="w-full sm:w-auto bg-temple-saffron hover:bg-temple-saffron/90"
                          onClick={() => {
                            setInviteCode("");
                            setInviteName("");
                            setInviteEmail("");
                            setInvitePhone("");
                            setInviteRole("personnel");
                            setIsInviteUserOpen(false);
                          }}
                        >
                          Done
                        </Button>
                      </DialogFooter>
                    </>
                  )}
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              <Button
                className="w-full justify-start shadow-sm bg-temple-background hover:bg-temple-gold/10 text-temple-maroon"
                variant="outline"
                onClick={() => setIsInviteUserOpen(true)}
              >
                <Users size={20} className="mr-2" /> Invite New Personnel
              </Button>
            </div>
          </div>

          {/* Quick links section */}
          <div className="mobile-card">
            <h2 className="mobile-header mb-4">Admin Actions</h2>
            <div className="grid grid-cols-1 gap-3">
              <Button
                className="justify-start shadow-sm bg-temple-background hover:bg-temple-gold/10 text-temple-maroon"
                variant="outline"
                onClick={() => navigate("/reports")}
              >
                <BarChart2 size={20} className="mr-2" /> Sales Reports
              </Button>
              <Button
                className="justify-start shadow-sm bg-temple-background hover:bg-temple-gold/10 text-temple-maroon"
                variant="outline"
                onClick={() => navigate("/books")}
              >
                <BookOpen size={20} className="mr-2" /> Manage Inventory
              </Button>
              <Button
                className="justify-start shadow-sm bg-temple-background hover:bg-temple-gold/10 text-temple-maroon"
                variant="outline"
                onClick={() => navigate("/settings")}
              >
                <Settings size={20} className="mr-2" /> App Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
