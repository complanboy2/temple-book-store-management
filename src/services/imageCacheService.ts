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
  private readonly CACHE_EXPIRY = 24 * 60 * 60 * 1000;

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
      const response = await fetch(originalUrl);
      if (!response.ok) return null;

      const blob = await response.blob();
      if (!blob.type.startsWith('image/')) return null;

      this.cache.set(urlHash, {
        url: originalUrl,
        hash: urlHash,
        timestamp: Date.now(),
        blob,
      });

      return URL.createObjectURL(blob);
    } catch {
      return null;
    }
  }

  async uploadAndCacheImage(file: File): Promise<string | null> {
    try {
      const fileHash = await this.generateHash(file);
      const fileName = `${fileHash}-${file.name.replace(/\s+/g, '-')}`;

      const { error: uploadError } = await supabase.storage
        .from('book-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (uploadError && !uploadError.message.includes('already exists')) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data: urlData, error: publicUrlError } = supabase.storage
        .from('book-images')
        .getPublicUrl(fileName);

      if (publicUrlError || !urlData?.publicUrl) {
        console.error('Public URL error:', publicUrlError);
        return null;
      }

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
