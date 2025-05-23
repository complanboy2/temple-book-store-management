
import { supabase } from '@/integrations/supabase/client';

interface CachedImage {
  url: string;
  hash: string;
  timestamp: number;
  blob: Blob;
}

class ImageCacheService {
  private cache = new Map<string, CachedImage>();
  private readonly CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

  private generateHash(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);
        let hash = 0;
        for (let i = 0; i < uint8Array.length; i++) {
          hash = ((hash << 5) - hash + uint8Array[i]) & 0xffffffff;
        }
        resolve(hash.toString(36));
      };
      reader.readAsArrayBuffer(file);
    });
  }

  private generateUrlHash(url: string): string {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      hash = ((hash << 5) - hash + url.charCodeAt(i)) & 0xffffffff;
    }
    return hash.toString(36);
  }

  async getCachedImageUrl(originalUrl: string): Promise<string | null> {
    if (!originalUrl) return null;

    const urlHash = this.generateUrlHash(originalUrl);
    const cached = this.cache.get(urlHash);

    // Check if cached and not expired
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_EXPIRY) {
      console.log("Using cached image for:", originalUrl);
      return URL.createObjectURL(cached.blob);
    }

    // Fetch and cache the image
    try {
      console.log("Fetching and caching image:", originalUrl);
      const response = await fetch(originalUrl);
      if (!response.ok) {
        console.error("Failed to fetch image:", response.status, response.statusText);
        return null;
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      // Cache the image
      this.cache.set(urlHash, {
        url: originalUrl,
        hash: urlHash,
        timestamp: Date.now(),
        blob: blob
      });

      return objectUrl;
    } catch (error) {
      console.error("Error fetching image:", error);
      return null;
    }
  }

  async uploadAndCacheImage(file: File): Promise<string | null> {
    try {
      console.log("Uploading image to Supabase Storage...");
      
      // Generate hash for the file
      const fileHash = await this.generateHash(file);
      const fileName = `${fileHash}-${file.name.replace(/\s+/g, '-')}`;
      
      const { data, error } = await supabase
        .storage
        .from('book-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true // Allow overwriting if same hash
        });
        
      if (error) {
        console.error("Failed to upload to Supabase Storage:", error);
        return null;
      }
      
      // Get public URL
      const { data: urlData } = supabase
        .storage
        .from('book-images')
        .getPublicUrl(fileName);
        
      if (!urlData.publicUrl) {
        console.error("Failed to get public URL");
        return null;
      }

      console.log("Image uploaded successfully:", urlData.publicUrl);

      // Cache the uploaded image locally
      const blob = new Blob([file], { type: file.type });
      const urlHash = this.generateUrlHash(urlData.publicUrl);
      
      this.cache.set(urlHash, {
        url: urlData.publicUrl,
        hash: fileHash,
        timestamp: Date.now(),
        blob: blob
      });

      return urlData.publicUrl;
    } catch (error) {
      console.error("Error in uploadAndCacheImage:", error);
      return null;
    }
  }

  clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.CACHE_EXPIRY) {
        URL.revokeObjectURL(URL.createObjectURL(cached.blob));
        this.cache.delete(key);
      }
    }
  }

  clearCache(): void {
    for (const [key, cached] of this.cache.entries()) {
      URL.revokeObjectURL(URL.createObjectURL(cached.blob));
    }
    this.cache.clear();
  }
}

export const imageCacheService = new ImageCacheService();
