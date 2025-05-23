
// src/components/BookImage.tsx
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
  const [displayUrl, setDisplayUrl] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

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
        const cached = await getCachedImageUrl(imageUrl);
        
        if (!active) return;
        
        if (cached) {
          objectUrl = cached;
          setDisplayUrl(cached);
          setHasError(false);
        } else {
          setDisplayUrl(imageUrl); // Fallback to direct URL
          setHasError(false);
        }
      } catch (error) {
        console.error(`Error loading image: ${error}`);
        if (active) {
          setDisplayUrl(imageUrl); // Fallback to direct URL
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
    <div className={cn("w-full h-40 overflow-hidden rounded-md bg-gray-100 flex items-center justify-center", className)}>
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
