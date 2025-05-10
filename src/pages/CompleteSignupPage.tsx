import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { storeInviteCode, getPendingInviteCode } from "@/services/localStorageService";

const CompleteSignupPage = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { completeRegistration, isAuthenticated } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [invalidInvite, setInvalidInvite] = useState(false);

  // Handle invite code from URL and restore from localStorage if app was installed after receiving link
  useEffect(() => {
    // Extract invite code from URL path or query parameter
    const pathSegments = location.pathname.split('/');
    const inviteCode = pathSegments[pathSegments.length - 1] !== 'complete-signup' 
      ? pathSegments[pathSegments.length - 1]
      : new URLSearchParams(location.search).get('code');
      
    if (inviteCode) {
      console.log("Found invite code in URL:", inviteCode);
      // Store the code in localStorage for retrieval after app installation
      storeInviteCode(inviteCode);
    } else {
      // Check if we have a pending invite code from before installing the app
      const pendingCode = getPendingInviteCode();
      if (pendingCode) {
        console.log("Retrieved pending invite code from localStorage:", pendingCode);
        // Use this code for registration
        // The existing form logic would continue here...
      }
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (isAuthenticated) {
      navigate("/");
    }

    // Validate invite code
    const checkInvite = async () => {
      try {
        const storedInvites = localStorage.getItem('temple_invites');
        if (!storedInvites || !inviteCode) {
          setInvalidInvite(true);
          return;
        }

        const invites = JSON.parse(storedInvites);
        if (!invites[inviteCode]) {
          setInvalidInvite(true);
        }
      } catch (error) {
        setInvalidInvite(true);
      }
    };

    checkInvite();
  }, [isAuthenticated, navigate, inviteCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteCode) {
      toast({
        title: "Error",
        description: "Invalid invite code",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await completeRegistration(inviteCode, password);
      toast({
        title: "Success",
        description: "Registration completed successfully",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete registration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (invalidInvite) {
    return (
      <div className="min-h-screen bg-temple-background flex flex-col items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-temple-maroon text-center">Invalid Invite</CardTitle>
            <CardDescription className="text-center">
              This invite link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              className="w-full bg-temple-saffron hover:bg-temple-saffron/90"
              onClick={() => navigate("/login")}
            >
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-temple-background flex flex-col items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-temple-maroon text-center">Complete Your Registration</CardTitle>
          <CardDescription className="text-center">
            Set your password to complete your account setup.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-temple-saffron hover:bg-temple-saffron/90"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Complete Registration"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteSignupPage;
