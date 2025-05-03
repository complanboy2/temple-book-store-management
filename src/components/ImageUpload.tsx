
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/services/imageService";
import { useTranslation } from "react-i18next";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface ImageUploadProps {
  initialImageUrl?: string;
  onImageUploaded: (url: string) => void;
  onImageChange?: (file: File | null) => void;
  bookMetadata?: {
    author?: string;
    name?: string;
    printingInstitute?: string;
  };
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  initialImageUrl,
  onImageUploaded,
  onImageChange,
  bookMetadata = {}
}) => {
  const [imageUrl, setImageUrl] = useState<string | undefined>(initialImageUrl);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      // First, notify parent of file selection
      if (onImageChange) {
        onImageChange(file);
      }
      
      // For immediate preview without waiting for upload
      const objectUrl = URL.createObjectURL(file);
      setImageUrl(objectUrl);

      // Handle actual upload if needed immediately
      const uploadUrl = await getImageUrl(file, bookMetadata);
      
      if (uploadUrl) {
        setImageUrl(uploadUrl);
        onImageUploaded(uploadUrl);
      }
      
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    setImageUrl(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onImageChange) {
      onImageChange(null);
    }
    onImageUploaded('');
  };

  return (
    <div className="w-full">
      <input 
        type="file" 
        id="book-image" 
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
        ref={fileInputRef}
      />

      {imageUrl ? (
        <div className="relative mb-4">
          <AspectRatio ratio={4/3} className="bg-muted overflow-hidden rounded-lg border">
            <img 
              src={imageUrl} 
              alt={t("common.bookCover")} 
              className="object-contain w-full h-full" 
            />
          </AspectRatio>
          <div className="flex justify-end mt-2">
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={removeImage}
            >
              {t("common.remove")}
            </Button>
          </div>
        </div>
      ) : (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm font-medium mb-1">{t("common.bookCoverImage")}</p>
          <p className="text-xs text-gray-500 mb-2">{t("common.uploadCoverImageOptional")}</p>
          <p className="text-xs text-gray-500">{t("common.clickToUpload")}</p>
          <p className="text-xs text-gray-500">{t("common.orDragAndDrop")}</p>
        </div>
      )}
      
      {isUploading && (
        <div className="mt-2 text-center">
          <p className="text-sm text-gray-500">{t("common.uploading")}...</p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
