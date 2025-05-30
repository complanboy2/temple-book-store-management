
import { Book } from "@/types";
import CryptoJS from "crypto-js";

// Cache expiry settings
const CACHE_EXPIRY = {
  BOOKS: 30 * 60 * 1000, // 30 minutes
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
    
    // Cache each book's static details individually for longer term storage
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
      imageUrl: book.imageUrl
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

// Clear expired caches
export const clearExpiredCaches = (): void => {
  try {
    console.log("Clearing expired caches from localStorage");
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('books_')) {
        try {
          const cache: BookCache = JSON.parse(localStorage.getItem(key) || '{}');
          if (Date.now() - cache.timestamp > CACHE_EXPIRY.BOOKS) {
            localStorage.removeItem(key);
            console.log(`Removed expired book cache: ${key}`);
          }
        } catch (e) {
          localStorage.removeItem(key); // Remove invalid entries
        }
      } else if (key.startsWith('book_details_')) {
        try {
          const cache: BookDetailsCache = JSON.parse(localStorage.getItem(key) || '{}');
          if (Date.now() - cache.timestamp > CACHE_EXPIRY.BOOK_DETAILS) {
            localStorage.removeItem(key);
            console.log(`Removed expired book details cache: ${key}`);
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
    console.log(`Stored invite code in localStorage: ${code}`);
  } catch (error) {
    console.error("Error storing invite code:", error);
  }
};

export const getPendingInviteCode = (): string | null => {
  try {
    const code = localStorage.getItem('pending_invite_code');
    console.log(`Retrieved invite code from localStorage: ${code}`);
    return code;
  } catch (error) {
    console.error("Error retrieving invite code:", error);
    return null;
  }
};

export const clearPendingInviteCode = (): void => {
  try {
    localStorage.removeItem('pending_invite_code');
    console.log("Cleared invite code from localStorage");
  } catch (error) {
    console.error("Error clearing invite code:", error);
  }
};
