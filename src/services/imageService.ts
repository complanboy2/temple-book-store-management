
import { imageCacheService } from './imageCacheService';

/**
 * Uploads an image to Supabase Storage with local caching and returns a public URL
 * @param file The file to upload
 * @returns A promise that resolves to the public URL of the uploaded image, or null if upload fails
 */
export const getImageUrl = async (file: File): Promise<string | null> => {
  return await imageCacheService.uploadAndCacheImage(file);
};

/**
 * Gets a cached image URL or fetches it if not cached
 * @param url The original image URL
 * @returns A promise that resolves to the cached image URL or null if failed
 */
export const getCachedImageUrl = async (url: string): Promise<string | null> => {
  return await imageCacheService.getCachedImageUrl(url);
};
