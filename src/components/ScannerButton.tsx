
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Barcode } from "lucide-react";

interface ScannerButtonProps {
  onScanComplete?: (code: string) => void;
  onCodeScanned?: (code: string) => void;
}

const ScannerButton: React.FC<ScannerButtonProps> = ({ onScanComplete, onCodeScanned }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [manualCode, setManualCode] = useState("");

  // In a real app, this would integrate with a barcode scanning library
  const simulateScan = () => {
    // For now, we'll just prompt for manual entry
    setIsDialogOpen(true);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      // Support both callback names for backward compatibility
      if (onCodeScanned) onCodeScanned(manualCode);
      if (onScanComplete) onScanComplete(manualCode);
      
      setManualCode("");
      setIsDialogOpen(false);
    }
  };

  return (
    <>
      <Button 
        onClick={simulateScan} 
        className="bg-temple-gold text-white hover:bg-temple-gold/90 w-full flex items-center justify-center gap-2 py-6 text-lg"
      >
        <Barcode className="h-6 w-6" />
        <span>Scan Book Code</span>
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-temple-card">
          <DialogHeader>
            <DialogTitle className="text-xl text-temple-maroon">Enter Book Code</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Enter the barcode or ID of the book manually:
              </p>
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="temple-input w-full"
                placeholder="Enter code here..."
                autoFocus
              />
            </div>
            <div className="flex justify-end">
              <Button 
                type="submit" 
                className="bg-temple-saffron hover:bg-temple-saffron/90"
              >
                Submit
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ScannerButton;
