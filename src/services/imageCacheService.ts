
import localforage from 'localforage';
import { sha256 } from 'hash-wasm';

const CACHE_EXPIRY_TIME = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const CACHE_URLS_KEY = 'cached_image_urls';
const STORE_NAME = 'image_cache';

interface CachedUrls {
  [hash: string]: {
    url: string;
    timestamp: number;
  };
}

class ImageCacheService {
  private CACHE_EXPIRY_TIME = 7 * 24 * 60 * 60 * 1000; // 7 days
  private CACHE_URLS_KEY = 'cached_image_urls';
  private STORE_NAME = 'image_cache';
  
  constructor() {
    this.setupCache();
  }

  private async setupCache() {
    // Initialize localForage
    localforage.config({
      name: 'templeBookStore',
      storeName: this.STORE_NAME,
      description: 'Cache for storing book images',
    });
    
    // Clean up expired cache entries
    await this.removeExpiredCacheEntries();
  }

  /**
   * Opens the IndexedDB database.
   */
  private async openDB(): Promise<typeof localforage> {
    return localforage;
  }

  /**
   * Generates a unique hash for a given URL.
   * @param url The URL to hash.
   * @returns A promise that resolves to the hash string.
   */
  async generateHash(url: string): Promise<string> {
    return await sha256(url);
  }

  /**
   * Uploads an image to Supabase Storage and caches it locally.
   * @param file The file to upload.
   * @returns A promise that resolves to the public URL of the uploaded image.
   */
  async uploadAndCacheImage(file: File): Promise<string> {
    // Use the hardcoded Supabase credentials from the client
    const supabaseUrl = 'https://pijhrmuamnwdgucfnycl.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpamhybXVhbW53ZGd1Y2ZueWNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNDk1NTAsImV4cCI6MjA2MDgyNTU1MH0.qf5P5eWDSLRmFKxIwtqBygxNAvIFtqGxJN3J4nX7ocE';
  
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
  
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    
    console.log(`Uploading image: ${filename}`);
    
    const { data, error } = await supabase.storage
      .from('book-images')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (error) {
      console.error("Error uploading image to Supabase:", error);
      throw new Error("Failed to upload image to Supabase");
    }
    
    const publicURL = `${supabaseUrl}/storage/v1/object/public/book-images/${filename}`;
    console.log(`Image uploaded successfully: ${publicURL}`);
    
    // Cache the image
    await this.cacheImage(publicURL, file);
    
    return publicURL;
  }

  /**
   * Caches an image file in IndexedDB with a unique hash as the key.
   * @param url The URL of the image to cache.
   * @param file The image file to cache.
   * @returns A promise that resolves when the image is successfully cached.
   */
  private async cacheImage(url: string, file: File): Promise<void> {
    try {
      const hash = await this.generateHash(url);
      const db = await this.openDB();
      
      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      await db.setItem(hash, arrayBuffer);
      
      // Update cache URLs
      const cachedUrls = this.getCachedUrls();
      cachedUrls[hash] = { url: url, timestamp: Date.now() };
      localStorage.setItem(this.CACHE_URLS_KEY, JSON.stringify(cachedUrls));
      
      console.log(`Cached image with hash ${hash} for URL: ${url}`);
    } catch (error) {
      console.error(`Failed to cache image for URL ${url}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves a cached image URL from IndexedDB.
   * @param url The URL of the image to retrieve.
   * @returns A promise that resolves to the cached image URL, or null if not found.
   */
  async getCachedImageUrl(url: string): Promise<string | null> {
    try {
      const hash = await this.generateHash(url);
      const cachedUrls = this.getCachedUrls();
      
      // Check if we have the URL mapping first
      if (!cachedUrls[hash]) {
        console.log(`No cached URL mapping found for: ${url}`);
        return null;
      }
      
      const db = await this.openDB();
      const cachedData = await db.getItem(hash) as ArrayBuffer | null;
      
      if (!cachedData) {
        console.log(`No cached image data found for URL: ${url}`);
        // Clean up the URL mapping if data is missing
        delete cachedUrls[hash];
        localStorage.setItem(this.CACHE_URLS_KEY, JSON.stringify(cachedUrls));
        return null;
      }
      
      // Convert ArrayBuffer to Blob
      const blob = new Blob([cachedData]);
      
      // Create a local URL for the Blob
      const cachedUrl = URL.createObjectURL(blob);
      
      console.log(`Retrieved cached image for URL: ${url}`);
      return cachedUrl;
    } catch (error) {
      console.error(`Failed to retrieve cached image for URL ${url}:`, error);
      return null;
    }
  }

  /**
   * Retrieves cached URLs from localStorage.
   * @returns The cached URLs object.
   */
  getCachedUrls(): CachedUrls {
    const cachedUrlsString = localStorage.getItem(this.CACHE_URLS_KEY);
    return cachedUrlsString ? JSON.parse(cachedUrlsString) : {};
  }

  /**
   * Removes expired cache entries from IndexedDB.
   */
  async removeExpiredCacheEntries(): Promise<void> {
    try {
      const cachedUrls = this.getCachedUrls();
      const now = Date.now();
      
      for (const hash in cachedUrls) {
        const { timestamp } = cachedUrls[hash];
        if (now - timestamp > this.CACHE_EXPIRY_TIME) {
          console.log(`Removing expired cache entry for hash ${hash}`);
          
          const db = await this.openDB();
          await db.removeItem(hash);
          
          delete cachedUrls[hash];
        }
      }
      
      localStorage.setItem(this.CACHE_URLS_KEY, JSON.stringify(cachedUrls));
    } catch (error) {
      console.error("Failed to remove expired cache entries:", error);
    }
  }

  /**
   * Remove a cached image
   */
  async removeCachedImage(originalUrl: string): Promise<void> {
    try {
      const hash = await this.generateHash(originalUrl);
      
      // Remove from IndexedDB
      const db = await this.openDB();
      await db.removeItem(hash);
      
      // Remove from localStorage tracking
      const cachedUrls = this.getCachedUrls();
      delete cachedUrls[hash];
      localStorage.setItem(this.CACHE_URLS_KEY, JSON.stringify(cachedUrls));
      
      console.log(`Removed cached image for URL: ${originalUrl}`);
    } catch (error) {
      console.warn(`Failed to remove cached image for ${originalUrl}:`, error);
    }
  }
}

export const imageCacheService = new ImageCacheService();
