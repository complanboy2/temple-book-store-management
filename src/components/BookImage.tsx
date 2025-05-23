
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getCachedImage, cacheImage } from "@/services/localStorageService";

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
  const [cachedImageUrl, setCachedImageUrl] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    if (!imageUrl) {
      setCachedImageUrl(undefined);
      setIsLoading(false);
      return;
    }
    
    // Reset states when imageUrl changes
    setIsLoading(true);
    setHasError(false);
    
    // First check if the image is already in cache
    const cached = getCachedImage(imageUrl);
    if (cached) {
      console.log("Using cached image from localStorage");
      setCachedImageUrl(cached);
      setIsLoading(false);
      return;
    }
    
    // If not in cache, fetch and cache it
    const fetchAndCacheImage = async () => {
      try {
        setIsLoading(true);
        const dataUrl = await cacheImage(imageUrl);
        if (dataUrl) {
          console.log("Cached new image in localStorage");
          setCachedImageUrl(dataUrl);
        } else {
          // Fallback to original URL if caching fails
          console.warn("Caching failed, using original URL");
          setCachedImageUrl(imageUrl);
        }
      } catch (error) {
        console.error("Error caching image:", error);
        setHasError(true);
        // Still try to use the original URL
        setCachedImageUrl(imageUrl);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAndCacheImage();
  }, [imageUrl]);

  const handleImageError = () => {
    console.log("Image failed to load:", imageUrl);
    setHasError(true);
  };

  return (
    <div className={cn("w-full h-40 overflow-hidden rounded-md bg-gray-100 flex items-center justify-center", className)}>
      {isLoading ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <span className="animate-pulse bg-gray-200 w-12 h-12 rounded-full"></span>
        </div>
      ) : cachedImageUrl && !hasError ? (
        <img 
          src={cachedImageUrl} 
          alt={alt}
          className="w-full h-full object-cover" 
          loading="lazy"
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
