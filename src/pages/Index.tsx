
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    } else {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-temple-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-temple-maroon">Temple Book Stall Manager</h1>
        <p className="text-xl text-gray-600 mb-6">Redirecting you to the appropriate page...</p>
        <Button
          onClick={() => navigate("/login")}
          className="bg-temple-saffron hover:bg-temple-saffron/90"
        >
          Go to Login
        </Button>
      </div>
    </div>
  );
};

export default Index;
