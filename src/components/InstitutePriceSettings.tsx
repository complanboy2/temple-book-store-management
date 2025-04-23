
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  getInstituteSalePercentage, 
  setInstituteSalePercentage, 
  getPrintingInstitutes 
} from "@/services/storageService";
import { useToast } from "@/hooks/use-toast";

const InstitutePriceSettings: React.FC = () => {
  const [institutes, setInstitutes] = useState<string[]>([]);
  const [percentages, setPercentages] = useState<Record<string, number>>({});
  const [newInstitute, setNewInstitute] = useState<string>("");
  const [newPercentage, setNewPercentage] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    // Load data
    const loadedInstitutes = getPrintingInstitutes();
    const loadedPercentages = getInstituteSalePercentage();
    
    setInstitutes(loadedInstitutes);
    setPercentages(loadedPercentages);
  }, []);

  const handleSavePercentage = (institute: string) => {
    const updatedPercentages = { ...percentages };
    setInstituteSalePercentage(updatedPercentages);
    
    toast({
      title: "Success",
      description: `Updated percentage for ${institute}`,
    });
  };

  const handlePercentageChange = (institute: string, value: string) => {
    const percentage = parseFloat(value);
    if (!isNaN(percentage)) {
      setPercentages(prev => ({
        ...prev,
        [institute]: percentage
      }));
    }
  };

  const handleAddNew = () => {
    if (!newInstitute.trim()) {
      toast({
        title: "Error",
        description: "Institute name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    const percentage = parseFloat(newPercentage);
    if (isNaN(percentage)) {
      toast({
        title: "Error",
        description: "Percentage must be a valid number",
        variant: "destructive",
      });
      return;
    }

    // Update institutes list
    const updatedInstitutes = [...institutes, newInstitute];
    setInstitutes(updatedInstitutes);
    
    // Save to local storage
    const localStorageInstitutes = getPrintingInstitutes();
    if (!localStorageInstitutes.includes(newInstitute)) {
      localStorageInstitutes.push(newInstitute);
      localStorage.setItem('printingInstitutes', JSON.stringify(localStorageInstitutes));
    }

    // Update and save percentages
    const updatedPercentages = {
      ...percentages,
      [newInstitute]: percentage
    };
    setPercentages(updatedPercentages);
    setInstituteSalePercentage(updatedPercentages);

    // Reset form
    setNewInstitute("");
    setNewPercentage("");

    toast({
      title: "Success",
      description: `Added ${newInstitute} with ${percentage}% markup`,
    });
  };

  return (
    <Card className="temple-card mb-6">
      <CardHeader>
        <CardTitle>Printing Institute Price Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {institutes.map(institute => (
            <div key={institute} className="flex items-center gap-4">
              <div className="flex-1">
                <p className="font-medium">{institute}</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={percentages[institute] || 0}
                  onChange={(e) => handlePercentageChange(institute, e.target.value)}
                  className="w-24"
                />
                <span>%</span>
                <Button 
                  onClick={() => handleSavePercentage(institute)}
                  size="sm"
                >
                  Save
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-border">
          <h3 className="font-medium mb-3">Add New Institute</h3>
          <div className="flex flex-col md:flex-row gap-3">
            <Input
              placeholder="Institute Name"
              value={newInstitute}
              onChange={(e) => setNewInstitute(e.target.value)}
              className="flex-1"
            />
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="Percentage"
                value={newPercentage}
                onChange={(e) => setNewPercentage(e.target.value)}
                className="w-24"
              />
              <span>%</span>
            </div>
            <Button onClick={handleAddNew}>Add</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InstitutePriceSettings;
