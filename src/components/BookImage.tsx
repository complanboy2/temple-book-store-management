
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
  const [cachedImageUrl, setCachedImageUrl] = useState<string | undefined>(imageUrl);
  
  useEffect(() => {
    if (!imageUrl) {
      setCachedImageUrl(undefined);
      return;
    }
    
    // First check if the image is already in cache
    const cached = getCachedImage(imageUrl);
    if (cached) {
      setCachedImageUrl(cached);
      return;
    }
    
    // If not in cache, fetch and cache it
    const fetchAndCacheImage = async () => {
      try {
        const dataUrl = await cacheImage(imageUrl);
        if (dataUrl) {
          setCachedImageUrl(dataUrl);
        }
      } catch (error) {
        console.error("Error caching image:", error);
        // Fallback to original URL
        setCachedImageUrl(imageUrl);
      }
    };
    
    fetchAndCacheImage();
  }, [imageUrl]);

  return (
    <div className={cn("w-full h-40 overflow-hidden rounded-md bg-gray-100 flex items-center justify-center", className)}>
      {cachedImageUrl ? (
        <img 
          src={cachedImageUrl} 
          alt={alt}
          className="w-full h-full object-cover" 
          loading="lazy"
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
