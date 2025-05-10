
import { Book } from "@/types";
import CryptoJS from "crypto-js";

// Cache expiry settings
const CACHE_EXPIRY = {
  BOOKS: 30 * 60 * 1000, // 30 minutes
  IMAGES: 24 * 60 * 60 * 1000, // 24 hours
  BOOK_DETAILS: 7 * 24 * 60 * 60 * 1000 // 7 days for static book details
};

// Book caching
interface BookCache {
  timestamp: number;
  books: Book[];
}

export const cacheBooks = (books: Book[], stallId: string): void => {
  try {
    const cache: BookCache = {
      timestamp: Date.now(),
      books
    };
    localStorage.setItem(`books_${stallId}`, JSON.stringify(cache));
    console.log(`Cached ${books.length} books for stall ${stallId}`);
    
    // Also cache each book's static details individually for longer term storage
    books.forEach(book => {
      cacheBookDetails(book);
    });
  } catch (error) {
    console.error("Error caching books:", error);
  }
};

export const getCachedBooks = (stallId: string): Book[] | null => {
  try {
    const cacheJson = localStorage.getItem(`books_${stallId}`);
    if (!cacheJson) return null;

    const cache: BookCache = JSON.parse(cacheJson);
    const isExpired = Date.now() - cache.timestamp > CACHE_EXPIRY.BOOKS;

    if (isExpired) {
      console.log("Book cache expired, returning null");
      return null;
    }

    console.log(`Retrieved ${cache.books.length} cached books for stall ${stallId}`);
    return cache.books;
  } catch (error) {
    console.error("Error retrieving cached books:", error);
    return null;
  }
};

// Individual book static details caching (longer expiry)
interface BookDetailsCache {
  timestamp: number;
  details: {
    name: string;
    author: string;
    category?: string;
    printingInstitute?: string;
    imageUrl?: string;
    barcode?: string;
  }
}

export const cacheBookDetails = (book: Book): void => {
  try {
    if (!book.id) return;
    
    // Extract only static details that rarely change
    const staticDetails = {
      name: book.name,
      author: book.author,
      category: book.category,
      printingInstitute: book.printingInstitute,
      imageUrl: book.imageUrl,
      barcode: book.barcode
    };
    
    const cache: BookDetailsCache = {
      timestamp: Date.now(),
      details: staticDetails
    };
    
    localStorage.setItem(`book_details_${book.id}`, JSON.stringify(cache));
  } catch (error) {
    console.error("Error caching book details:", error);
  }
};

export const getCachedBookDetails = (bookId: string): BookDetailsCache['details'] | null => {
  try {
    const cacheJson = localStorage.getItem(`book_details_${bookId}`);
    if (!cacheJson) return null;
    
    const cache: BookDetailsCache = JSON.parse(cacheJson);
    const isExpired = Date.now() - cache.timestamp > CACHE_EXPIRY.BOOK_DETAILS;
    
    if (isExpired) return null;
    
    return cache.details;
  } catch (error) {
    console.error("Error retrieving cached book details:", error);
    return null;
  }
};

// Image caching
interface ImageCache {
  timestamp: number;
  dataUrl: string;
}

export const cacheImage = async (imageUrl: string): Promise<string | null> => {
  try {
    // Create a hash of the URL to use as a key
    const urlHash = CryptoJS.MD5(imageUrl).toString();
    const cacheKey = `img_${urlHash}`;

    // Check if already cached
    const existingCache = localStorage.getItem(cacheKey);
    if (existingCache) {
      const cache: ImageCache = JSON.parse(existingCache);
      const isExpired = Date.now() - cache.timestamp > CACHE_EXPIRY.IMAGES;

      if (!isExpired) {
        return cache.dataUrl;
      }
    }

    // Fetch the image and convert to data URL
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error("Failed to fetch image");
    
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        
        // Cache the data URL
        const cache: ImageCache = {
          timestamp: Date.now(),
          dataUrl
        };
        
        try {
          localStorage.setItem(cacheKey, JSON.stringify(cache));
          console.log(`Image cached: ${imageUrl}`);
          resolve(dataUrl);
        } catch (e) {
          // Handle localStorage quota exceeded
          console.warn("Failed to cache image, likely storage quota exceeded:", e);
          resolve(imageUrl); // Fall back to original URL
        }
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error caching image:", error);
    return imageUrl; // Fall back to original URL
  }
};

export const getCachedImage = (imageUrl: string): string | null => {
  try {
    const urlHash = CryptoJS.MD5(imageUrl).toString();
    const cacheKey = `img_${urlHash}`;
    
    const cacheJson = localStorage.getItem(cacheKey);
    if (!cacheJson) return null;

    const cache: ImageCache = JSON.parse(cacheJson);
    const isExpired = Date.now() - cache.timestamp > CACHE_EXPIRY.IMAGES;

    if (isExpired) {
      return null;
    }

    return cache.dataUrl;
  } catch (error) {
    console.error("Error retrieving cached image:", error);
    return null;
  }
};

// Clear expired caches
export const clearExpiredCaches = (): void => {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('books_')) {
        try {
          const cache: BookCache = JSON.parse(localStorage.getItem(key) || '{}');
          if (Date.now() - cache.timestamp > CACHE_EXPIRY.BOOKS) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          localStorage.removeItem(key); // Remove invalid entries
        }
      } else if (key.startsWith('img_')) {
        try {
          const cache: ImageCache = JSON.parse(localStorage.getItem(key) || '{}');
          if (Date.now() - cache.timestamp > CACHE_EXPIRY.IMAGES) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          localStorage.removeItem(key); // Remove invalid entries
        }
      } else if (key.startsWith('book_details_')) {
        try {
          const cache: BookDetailsCache = JSON.parse(localStorage.getItem(key) || '{}');
          if (Date.now() - cache.timestamp > CACHE_EXPIRY.BOOK_DETAILS) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          localStorage.removeItem(key); // Remove invalid entries
        }
      }
    });
  } catch (error) {
    console.error("Error clearing expired caches:", error);
  }
};

// Fix for invite link handling
export const storeInviteCode = (code: string): void => {
  try {
    localStorage.setItem('pending_invite_code', code);
  } catch (error) {
    console.error("Error storing invite code:", error);
  }
};

export const getPendingInviteCode = (): string | null => {
  try {
    return localStorage.getItem('pending_invite_code');
  } catch (error) {
    console.error("Error retrieving invite code:", error);
    return null;
  }
};

export const clearPendingInviteCode = (): void => {
  try {
    localStorage.removeItem('pending_invite_code');
  } catch (error) {
    console.error("Error clearing invite code:", error);
  }
};
