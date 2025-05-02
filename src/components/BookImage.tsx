
import React from "react";
import { cn } from "@/lib/utils";

interface BookImageProps {
  imageUrl?: string;
  className?: string;
  alt?: string;
}

const BookImage: React.FC<BookImageProps> = ({
  imageUrl,
  className,
  alt = "Book cover"
}) => {
  return (
    <div className={cn("w-full h-40 overflow-hidden rounded-md bg-gray-100", className)}>
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={alt}
          className="w-full h-full object-contain" 
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
