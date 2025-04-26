
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getImageUrl } from "@/services/imageService";

interface ImageUploadProps {
  initialImageUrl?: string;
  onImageUploaded: (imageUrl: string) => void;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ initialImageUrl, onImageUploaded, className = "" }) => {
  const [imageUrl, setImageUrl] = useState<string | undefined>(initialImageUrl);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const placeholderImage = "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=300&h=400&fit=crop";
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size should be less than 5MB",
        variant: "destructive"
      });
      return;
    }
    
    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please upload an image file (JPEG, PNG, etc.)",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Use our enhanced image service function
      const uploadUrl = await getImageUrl(file);
      
      if (uploadUrl) {
        setImageUrl(uploadUrl);
        onImageUploaded(uploadUrl);
        
        toast({
          title: "Success",
          description: "Image uploaded successfully",
        });
      } else {
        throw new Error("Failed to upload image");
      }
    } catch (error) {
      console.error("Error in image upload:", error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl(undefined);
    onImageUploaded("");
  };

  return (
    <div className={className}>
      <div className="mb-3">
        <p className="text-sm font-medium mb-1">Book Cover Image</p>
        <p className="text-xs text-muted-foreground">Upload a cover image for the book (optional)</p>
      </div>
      
      <div className="border border-dashed border-muted rounded-lg p-2 bg-muted/30 max-w-[300px] mx-auto">
        <AspectRatio ratio={3/4} className="bg-muted relative">
          {imageUrl ? (
            <>
              <img 
                src={imageUrl} 
                alt="Book cover" 
                className="object-cover w-full h-full rounded-md"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = placeholderImage;
                  toast({
                    title: "Error",
                    description: "Failed to load image",
                    variant: "destructive"
                  });
                }}
              />
              <Button 
                size="icon" 
                variant="destructive" 
                className="absolute top-2 right-2 h-8 w-8"
                onClick={handleRemoveImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                Click to upload<br />or drag and drop
              </p>
              <input 
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleImageUpload}
                disabled={isUploading}
              />
              {isUploading && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <p className="text-white">Uploading...</p>
                </div>
              )}
            </div>
          )}
        </AspectRatio>
      </div>
    </div>
  );
};

export default ImageUpload;
