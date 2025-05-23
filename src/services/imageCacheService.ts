
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

    // Try to fetch the image and check if it exists
    try {
      console.log("Fetching and caching image:", originalUrl);
      const response = await fetch(originalUrl);
      if (!response.ok) {
        console.error("Failed to fetch image:", response.status, response.statusText);
        return null;
      }

      const blob = await response.blob();
      
      // Verify it's actually an image
      if (!blob.type.startsWith('image/')) {
        console.error("Fetched content is not an image:", blob.type);
        return null;
      }

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
      
      // First, try to upload the file
      const { data, error } = await supabase
        .storage
        .from('book-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (error) {
        console.error("Failed to upload to Supabase Storage:", error);
        // If it's a policy error, the file might already exist, try to get the URL anyway
        if (error.message?.includes('policy') || error.message?.includes('already exists')) {
          console.log("File might already exist, trying to get public URL...");
        } else {
          return null;
        }
      }
      
      // Get public URL regardless of upload result (file might already exist)
      const { data: urlData } = supabase
        .storage
        .from('book-images')
        .getPublicUrl(fileName);
        
      if (!urlData.publicUrl) {
        console.error("Failed to get public URL");
        return null;
      }

      console.log("Image URL obtained:", urlData.publicUrl);

      // Verify the file actually exists by trying to fetch it
      try {
        const testResponse = await fetch(urlData.publicUrl);
        if (!testResponse.ok) {
          console.error("Uploaded file verification failed:", testResponse.status);
          return null;
        }
      } catch (verifyError) {
        console.error("Could not verify uploaded file:", verifyError);
        return null;
      }

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
