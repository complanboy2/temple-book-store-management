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
  const [displayUrl, setDisplayUrl] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;

    const loadImage = async () => {
      if (!imageUrl) {
        setDisplayUrl(undefined);
        setIsLoading(false);
        setHasError(false);
        return;
      }

      setIsLoading(true);
      setHasError(false);
      console.log("Loading image with caching:", imageUrl);

      try {
        const cachedUrl = await getCachedImageUrl(imageUrl);
        if (cachedUrl && active) {
          setDisplayUrl(cachedUrl);
          setHasError(false);
        } else if (active) {
          setDisplayUrl(undefined);
          setHasError(true);
        }
      } catch (err) {
        if (active) {
          setDisplayUrl(undefined);
          setHasError(true);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadImage();

    return () => {
      active = false;
    };
  }, [imageUrl]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
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