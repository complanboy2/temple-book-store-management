
// src/components/BookImage.tsx
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getCachedImageUrl } from "@/services/imageService";

export interface BookImageProps {
  imageUrl?: string;
  className?: string;
  alt?: string;
  size?: "small" | "medium" | "large";
}

const BookImage: React.FC<BookImageProps> = ({
  imageUrl,
  className,
  alt = "Book cover",
  size = "medium"
}) => {
  const [displayUrl, setDisplayUrl] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Determine size class based on the size prop
  const sizeClass = React.useMemo(() => {
    switch (size) {
      case "small": return "h-20";
      case "large": return "h-60";
      case "medium":
      default: return "h-40";
    }
  }, [size]);

  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;

    const load = async () => {
      setIsLoading(true);
      setHasError(false);

      if (!imageUrl) {
        if (active) {
          setDisplayUrl(undefined);
          setIsLoading(false);
        }
        return;
      }

      try {
        console.log(`Loading image for URL: ${imageUrl}`);
        
        // Try to get the cached image URL
        const cached = await getCachedImageUrl(imageUrl);
        
        if (!active) return;
        
        if (cached) {
          objectUrl = cached;
          setDisplayUrl(cached);
          setHasError(false);
        } else {
          // If caching fails, fall back to direct URL
          setDisplayUrl(imageUrl);
          setHasError(false);
        }
      } catch (error) {
        console.error(`Error loading image: ${error}`);
        if (active) {
          // Fallback to direct URL if caching fails
          setDisplayUrl(imageUrl);
          setHasError(false);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    load();

    return () => { 
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [imageUrl]);

  return (
    <div className={cn(`w-full overflow-hidden rounded-md bg-gray-100 flex items-center justify-center ${sizeClass}`, className)}>
      {isLoading ? (
        <div className="animate-pulse bg-gray-200 w-12 h-12 rounded-full" />
      ) : hasError || !displayUrl ? (
        <div className="text-xs text-gray-400">No image</div>
      ) : (
        <img
          src={displayUrl}
          alt={alt}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
};

export default BookImage;
