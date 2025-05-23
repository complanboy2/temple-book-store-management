
// src/services/imageCacheService.ts
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

    if (cached && Date.now() - cached.timestamp < this.CACHE_EXPIRY) {
      return URL.createObjectURL(cached.blob);
    }

    try {
      console.log(`Fetching image from URL: ${originalUrl}`);
      const response = await fetch(originalUrl);
      if (!response.ok) {
        console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        return null;
      }

      const blob = await response.blob();
      if (!blob.type.startsWith('image/')) {
        console.error(`Invalid image type: ${blob.type}`);
        return null;
      }

      this.cache.set(urlHash, {
        url: originalUrl,
        hash: urlHash,
        timestamp: Date.now(),
        blob,
      });

      return URL.createObjectURL(blob);
    } catch (error) {
      console.error(`Error fetching image: ${error}`);
      return null;
    }
  }

  async uploadAndCacheImage(file: File): Promise<string | null> {
    try {
      const fileHash = await this.generateHash(file);
      const fileName = `${fileHash}-${file.name.replace(/\s+/g, '-')}`;
      console.log(`Uploading file: ${fileName} to book-images bucket`);

      // First check if the image already exists in storage
      const { data: existingData, error: checkError } = await supabase.storage
        .from('book-images')
        .list('', {
          search: fileName
        });

      if (checkError) {
        console.error('Error checking existing file:', checkError);
      } else if (existingData && existingData.length > 0) {
        console.log('File already exists, retrieving URL');
        const { data: urlData } = supabase.storage
          .from('book-images')
          .getPublicUrl(fileName);
        
        if (urlData?.publicUrl) {
          // Add to cache
          const urlHash = this.generateUrlHash(urlData.publicUrl);
          this.cache.set(urlHash, {
            url: urlData.publicUrl,
            hash: fileHash,
            timestamp: Date.now(),
            blob: file
          });
          return urlData.publicUrl;
        }
      }

      // File doesn't exist, upload it
      const { error: uploadError } = await supabase.storage
        .from('book-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      // Get the public URL - Fix here: the getPublicUrl method only returns data, not error
      const { data: urlData } = supabase.storage
        .from('book-images')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        console.error('Failed to get public URL');
        return null;
      }

      // Verify the uploaded file is accessible
      try {
        const response = await fetch(urlData.publicUrl);
        if (!response.ok) {
          console.error('Verification failed:', response.statusText);
          return null;
        }

        const blob = await response.blob();
        const urlHash = this.generateUrlHash(urlData.publicUrl);

        this.cache.set(urlHash, {
          url: urlData.publicUrl,
          hash: fileHash,
          timestamp: Date.now(),
          blob,
        });

        return urlData.publicUrl;
      } catch (verifyError) {
        console.error('Verification error:', verifyError);
        return null;
      }
    } catch (error) {
      console.error('Unexpected error:', error);
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
