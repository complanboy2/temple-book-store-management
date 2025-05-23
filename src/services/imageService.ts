
import { imageCacheService } from './imageCacheService';

/**
 * Uploads an image to Supabase Storage with local caching and returns a public URL
 * @param file The file to upload
 * @returns A promise that resolves to the public URL of the uploaded image, or null if upload fails
 */
export const getImageUrl = async (file: File): Promise<string | null> => {
  if (!file) return null;
  
  try {
    console.log("Uploading image from imageService:", file.name);
    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error(`Invalid file type: ${file.type}`);
      return null;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.error(`File too large: ${file.size} bytes`);
      return null;
    }
    
    return await imageCacheService.uploadAndCacheImage(file);
  } catch (error) {
    console.error("Error in getImageUrl:", error);
    return null;
  }
};

/**
 * Gets a cached image URL or fetches it if not cached
 * @param url The original image URL
 * @returns A promise that resolves to the cached image URL or null if failed
 */
export const getCachedImageUrl = async (url: string): Promise<string | null> => {
  try {
    if (!url) return null;
    
    // Clean up the URL if it has query parameters
    const cleanUrl = url.split('?')[0];
    return await imageCacheService.getCachedImageUrl(cleanUrl);
  } catch (error) {
    console.error("Error in getCachedImageUrl:", error);
    return url; // Return original URL as fallback
  }
};
