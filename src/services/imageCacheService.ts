
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
    if (!url) return '';
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      hash = ((hash << 5) - hash + url.charCodeAt(i)) & 0xffffffff;
    }
    return hash.toString(36);
  }

  async getCachedImageUrl(originalUrl: string): Promise<string | null> {
    if (!originalUrl) return null;

    try {
      // Clean up the URL if it has query parameters
      const cleanUrl = originalUrl.split('?')[0];
      const urlHash = this.generateUrlHash(cleanUrl);
      const cached = this.cache.get(urlHash);

      if (cached && Date.now() - cached.timestamp < this.CACHE_EXPIRY) {
        return URL.createObjectURL(cached.blob);
      }

      console.log(`Fetching image from URL: ${cleanUrl}`);
      
      // Try to fetch without cache busting first
      let response = await fetch(cleanUrl, { 
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      // If that fails with a 400/401/403, try the URL directly without any parameters
      if (!response.ok && [400, 401, 403].includes(response.status)) {
        console.log("Initial fetch failed, trying direct URL");
        response = await fetch(cleanUrl, { mode: 'cors', credentials: 'omit' });
      }
      
      if (!response.ok) {
        console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        return originalUrl; // Fall back to original URL
      }

      const blob = await response.blob();
      if (!blob.type.startsWith('image/')) {
        console.error(`Invalid image type: ${blob.type}`);
        return originalUrl; // Fall back to original URL
      }

      this.cache.set(urlHash, {
        url: cleanUrl,
        hash: urlHash,
        timestamp: Date.now(),
        blob,
      });

      return URL.createObjectURL(blob);
    } catch (error) {
      console.error(`Error fetching image: ${error}`);
      return originalUrl; // Fall back to original URL as last resort
    }
  }

  async uploadAndCacheImage(file: File): Promise<string | null> {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.error(`Invalid file type: ${file.type}`);
        return null;
      }

      const fileHash = await this.generateHash(file);
      const fileName = `${fileHash}-${file.name.replace(/\s+/g, '-')}`;
      console.log(`Uploading file: ${fileName} to book-images bucket`);

      // First check if the image already exists in storage
      const { data: existingData, error: listError } = await supabase.storage
        .from('book-images')
        .list('', {
          search: fileName
        });

      if (listError) {
        console.error('Error checking existing file:', listError);
        // Continue with upload attempt even if listing failed
      }

      if (existingData && existingData.length > 0) {
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

      // File doesn't exist or listing failed, upload it
      const { error: uploadError } = await supabase.storage
        .from('book-images')
        .upload(fileName, file, { 
          cacheControl: '3600', 
          upsert: true,
          contentType: file.type // Ensure content type is set correctly
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('book-images')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        console.error('Failed to get public URL');
        throw new Error('Failed to get public URL');
      }

      // Store in cache without verification to avoid extra requests
      const urlHash = this.generateUrlHash(urlData.publicUrl);
      this.cache.set(urlHash, {
        url: urlData.publicUrl,
        hash: fileHash,
        timestamp: Date.now(),
        blob: file,
      });

      console.log('Upload successful, public URL:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Unexpected error during upload:', error);
      throw error; // Re-throw to let caller handle
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
