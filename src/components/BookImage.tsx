
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getCachedImageUrl } from "@/services/imageService";

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
    
    console.log("Loading image with caching:", imageUrl);
    setIsLoading(true);
    setHasError(false);
    
    // Use cached image service
    getCachedImageUrl(imageUrl)
      .then((cachedUrl) => {
        if (cachedUrl) {
          setDisplayUrl(cachedUrl);
          setHasError(false);
          console.log("Image loaded successfully from cache");
        } else {
          console.log("Failed to load cached image, showing fallback");
          setDisplayUrl(undefined);
          setHasError(true);
        }
      })
      .catch((error) => {
        console.error("Error loading cached image:", error);
        setDisplayUrl(undefined);
        setHasError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [imageUrl]);

  const handleImageLoad = () => {
    console.log("Cached image loaded successfully in img element");
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.log("Cached image failed to load in img element:", imageUrl);
    setHasError(true);
    setIsLoading(false);
    setDisplayUrl(undefined);
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
