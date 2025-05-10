
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Barcode } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ScannerButtonProps {
  onScanComplete?: (code: string) => void;
  onCodeScanned?: (code: string) => void;
  variant?: "default" | "compact";
}

const ScannerButton: React.FC<ScannerButtonProps> = ({ 
  onScanComplete, 
  onCodeScanned,
  variant = "default" 
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const { t } = useTranslation();

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

  if (variant === "compact") {
    return (
      <>
        <Button 
          onClick={simulateScan} 
          className="bg-temple-gold text-white hover:bg-temple-gold/90 flex items-center justify-center gap-2"
          size="sm"
        >
          <Barcode className="h-4 w-4" />
          <span>{t("common.scanCode")}</span>
        </Button>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-temple-card">
            <DialogHeader>
              <DialogTitle className="text-xl text-temple-maroon">{t("common.enterBookCode")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {t("common.enterBarcodeManually")}
                </p>
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="temple-input w-full"
                  placeholder={t("common.enterCodeHere")}
                  autoFocus
                />
              </div>
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  className="bg-temple-saffron hover:bg-temple-saffron/90"
                >
                  {t("common.submit")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Button 
        onClick={simulateScan} 
        className="bg-temple-gold text-white hover:bg-temple-gold/90 w-full flex items-center justify-center gap-2 py-6 text-lg"
      >
        <Barcode className="h-6 w-6" />
        <span>{t("common.scanBookCode")}</span>
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-temple-card">
          <DialogHeader>
            <DialogTitle className="text-xl text-temple-maroon">{t("common.enterBookCode")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {t("common.enterBarcodeManually")}
              </p>
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="temple-input w-full"
                placeholder={t("common.enterCodeHere")}
                autoFocus
              />
            </div>
            <div className="flex justify-end">
              <Button 
                type="submit" 
                className="bg-temple-saffron hover:bg-temple-saffron/90"
              >
                {t("common.submit")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ScannerButton;
