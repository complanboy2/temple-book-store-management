// src/components/ImageUpload.tsx
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getImageUrl, getCachedImageUrl } from "@/services/imageService";
import { useTranslation } from "react-i18next";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  initialImageUrl?: string;
  onImageUploaded: (url: string) => void;
  onImageChange?: (file: File | null) => void;
  bookMetadata?: {
    author?: string;
    name?: string;
    printingInstitute?: string;
  };
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  initialImageUrl,
  onImageUploaded,
  onImageChange,
  bookMetadata = {},
  className
}) => {
  const [imageUrl, setImageUrl] = useState<string | undefined>(initialImageUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const objectUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  // Revoke object URL when component unmounts
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  // Load initial image with caching
  useEffect(() => {
    if (!initialImageUrl) {
      setImageUrl(undefined);
      setHasError(false);
      return;
    }

    let active = true;
    getCachedImageUrl(initialImageUrl)
      .then((cachedUrl) => {
        if (active) {
          setImageUrl(cachedUrl || undefined);
          setHasError(!cachedUrl);
        }
      })
      .catch(() => {
        if (active) {
          setImageUrl(undefined);
          setHasError(true);
        }
      });

    return () => {
      active = false;
    };
  }, [initialImageUrl]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setHasError(false);

      onImageChange?.(file);

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      const objectUrl = URL.createObjectURL(file);
      objectUrlRef.current = objectUrl;
      setImageUrl(objectUrl);

      const uploadedUrl = await getImageUrl(file);
      if (!uploadedUrl) throw new Error("Upload failed");

      const cachedUrl = await getCachedImageUrl(uploadedUrl);
      setImageUrl(cachedUrl || uploadedUrl);
      onImageUploaded(uploadedUrl);
    } catch (error) {
      console.error("Upload error:", error);
      setImageUrl(undefined);
      setHasError(true);
      onImageUploaded("");
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageError = () => {
    setImageUrl(undefined);
    setHasError(true);
  };

  const removeImage = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    fileInputRef.current!.value = "";
    setImageUrl(undefined);
    setHasError(false);
    onImageChange?.(null);
    onImageUploaded("");
  };

  return (
    <div className={cn("w-full", className)}>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleImageUpload}
      />

      {imageUrl && !hasError ? (
        <div className="relative mb-4">
          <AspectRatio ratio={4 / 3} className="bg-muted overflow-hidden rounded-lg border">
            <img
              src={imageUrl}
              alt={t("common.bookCover")}
              className="object-contain w-full h-full"
              onError={handleImageError}
            />
          </AspectRatio>
          <div className="flex justify-end mt-2">
            <Button type="button" variant="outline" size="sm" onClick={removeImage}>
              {t("common.remove")}
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center hover:border-gray-400 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm font-medium mb-1">{t("common.bookCoverImage")}</p>
          <p className="text-xs text-gray-500">{t("common.uploadCoverImageOptional")}</p>
          <p className="text-xs text-gray-500">{t("common.clickToUpload")}</p>
          <p className="text-xs text-gray-500">{t("common.orDragAndDrop")}</p>
        </div>
      )}

      {isUploading && (
        <div className="mt-2 text-center">
          <p className="text-sm text-gray-500">{t("common.uploading")}...</p>
        </div>
      )}

      {hasError && (
        <div className="mt-2 text-center text-sm text-red-500">
          Failed to load or upload image
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
