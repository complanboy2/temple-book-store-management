
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const LoginPage: React.FC = () => {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(emailOrPhone, password);
      navigate("/");
    } catch (error) {
      console.error("Login failed:", error);
      toast({
        title: "Login Failed",
        description: "Invalid email/phone or password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-temple-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-temple-maroon">
            Temple Book Stall Manager
          </h1>
          <p className="text-muted-foreground mt-2">Login to manage your book stall</p>
        </div>

        <Card className="temple-card">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-temple-maroon">Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="emailOrPhone" className="text-lg font-medium">
                  Email or Phone
                </label>
                <input
                  id="emailOrPhone"
                  type="text"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  required
                  className="temple-input w-full"
                  placeholder="Enter your email or phone number"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-lg font-medium">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="temple-input w-full"
                  placeholder="Enter your password"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="temple-button w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <div className="text-center mt-6">
          <div className="text-sm text-muted-foreground space-y-1">
            <p>For demo purposes, use one of these accounts:</p>
            <p><strong>Admin Email:</strong> admin@temple.com</p>
            <p><strong>Admin Phone:</strong> 8885378147</p>
            <p><strong>Super Admin:</strong> complanboy2@gmail.com</p>
            <p><strong>Seller 1:</strong> seller1@nampally.com or 9989143572</p>
            <p><strong>Seller 2:</strong> seller2@nampally.com or 8919032243</p>
            <p><strong>Seller 3:</strong> seller3@nampally.com or 9100916479</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
