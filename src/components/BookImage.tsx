
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface BookImageProps {
  imageUrl?: string;
  className?: string;
  alt?: string;
}

const BookImage: React.FC<BookImageProps> = ({
  imageUrl,
  className,
  alt = "Book cover"
}) => {
  const [displayUrl, setDisplayUrl] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    if (!imageUrl) {
      setDisplayUrl(undefined);
      setIsLoading(false);
      setHasError(false);
      return;
    }
    
    console.log("Loading image:", imageUrl);
    setIsLoading(true);
    setHasError(false);
    
    // Use the image URL directly - remove all caching for now to fix loading issues
    setDisplayUrl(imageUrl);
    setIsLoading(false);
  }, [imageUrl]);

  const handleImageLoad = () => {
    console.log("Image loaded successfully:", imageUrl);
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.log("Image failed to load:", imageUrl);
    console.log("Error details:", e);
    setHasError(true);
    setIsLoading(false);
  };

  return (
    <div className={cn("w-full h-40 overflow-hidden rounded-md bg-gray-100 flex items-center justify-center", className)}>
      {isLoading ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <div className="animate-pulse bg-gray-200 w-12 h-12 rounded-full"></div>
        </div>
      ) : displayUrl && !hasError ? (
        <img 
          src={displayUrl} 
          alt={alt}
          className="w-full h-full object-cover" 
          loading="lazy"
          onLoad={handleImageLoad}
          onError={handleImageError}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
          <span className="text-xs text-center px-2">No image</span>
        </div>
      )}
    </div>
  );
};

export default BookImage;
