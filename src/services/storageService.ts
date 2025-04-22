
import { Book, Sale, RestockEntry, Institute, BookStall, User } from "../types";

// Local storage keys
const KEYS = {
  USERS: "temple_users",
  CURRENT_USER: "temple_current_user",
  INSTITUTES: "temple_institutes",
  BOOK_STALLS: "temple_book_stalls",
  BOOKS: "temple_books",
  SALES: "temple_sales",
  RESTOCK: "temple_restock",
  AUTHORS: "temple_authors",
  CATEGORIES: "temple_categories",
  SALE_PERCENTAGE: "temple_author_sale_percent",
};

// Generic function to get items from local storage
const getItems = <T>(key: string): T[] => {
  const items = localStorage.getItem(key);
  return items ? JSON.parse(items) : [];
};

// Generic function to set items in local storage
const setItems = <T>(key: string, items: T[]): void => {
  localStorage.setItem(key, JSON.stringify(items));
};

// User related functions
export const getUsers = (): User[] => getItems<User>(KEYS.USERS);
export const setUsers = (users: User[]): void => setItems(KEYS.USERS, users);
export const getCurrentUser = (): User | null => {
  const user = localStorage.getItem(KEYS.CURRENT_USER);
  return user ? JSON.parse(user) : null;
};
export const setCurrentUser = (user: User | null): void => {
  if (user) {
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(KEYS.CURRENT_USER);
  }
};

// Institute related functions
export const getInstitutes = (): Institute[] => getItems<Institute>(KEYS.INSTITUTES);
export const setInstitutes = (institutes: Institute[]): void => setItems(KEYS.INSTITUTES, institutes);

// BookStall related functions
export const getBookStalls = (): BookStall[] => getItems<BookStall>(KEYS.BOOK_STALLS);
export const setBookStalls = (bookStalls: BookStall[]): void => setItems(KEYS.BOOK_STALLS, bookStalls);

// Book related functions
export const getBooks = (): Book[] => getItems<Book>(KEYS.BOOKS);
export const setBooks = (books: Book[]): void => setItems(KEYS.BOOKS, books);

// Sale related functions
export const getSales = (): Sale[] => getItems<Sale>(KEYS.SALES);
export const setSales = (sales: Sale[]): void => setItems(KEYS.SALES, sales);
export const addSale = (sale: Sale): void => {
  const sales = getSales();
  sales.push(sale);
  setSales(sales);
};

// Restock related functions
export const getRestockEntries = (): RestockEntry[] => getItems<RestockEntry>(KEYS.RESTOCK);
export const setRestockEntries = (entries: RestockEntry[]): void => setItems(KEYS.RESTOCK, entries);
export const addRestockEntry = (entry: RestockEntry): void => {
  const entries = getRestockEntries();
  entries.push(entry);
  setRestockEntries(entries);
};

// Author functions
export const getAuthors = (): string[] => getItems<string>(KEYS.AUTHORS);
export const setAuthors = (authors: string[]) => setItems(KEYS.AUTHORS, authors);

// Category functions
export const getCategories = (): string[] => getItems<string>(KEYS.CATEGORIES);
export const setCategories = (categories: string[]) => setItems(KEYS.CATEGORIES, categories);

// Sale percentage by author
export const getAuthorSalePercentage = (): Record<string, number> => {
  const val = localStorage.getItem(KEYS.SALE_PERCENTAGE);
  return val ? JSON.parse(val) : {};
};
export const setAuthorSalePercentage = (obj: Record<string, number>) => {
  localStorage.setItem(KEYS.SALE_PERCENTAGE, JSON.stringify(obj));
};

// Book operations
export const getBooksByStall = (stallId: string): Book[] => {
  const books = getBooks();
  return books.filter(book => book.stallId === stallId);
};

export const updateBookQuantity = (bookId: string, changeAmount: number): void => {
  const books = getBooks();
  const bookIndex = books.findIndex(book => book.id === bookId);
  
  if (bookIndex !== -1) {
    books[bookIndex].quantity += changeAmount;
    books[bookIndex].updatedAt = new Date();
    setBooks(books);
  }
};

// Offline sync tracking
export const getUnsyncedSales = (): Sale[] => {
  const sales = getSales();
  return sales.filter(sale => !sale.synced);
};

export const getUnsyncedRestockEntries = (): RestockEntry[] => {
  const entries = getRestockEntries();
  return entries.filter(entry => !entry.synced);
};

export const markSaleSynced = (saleId: string): void => {
  const sales = getSales();
  const saleIndex = sales.findIndex(sale => sale.id === saleId);
  
  if (saleIndex !== -1) {
    sales[saleIndex].synced = true;
    setSales(sales);
  }
};

export const markRestockSynced = (entryId: string): void => {
  const entries = getRestockEntries();
  const entryIndex = entries.findIndex(entry => entry.id === entryId);
  
  if (entryIndex !== -1) {
    entries[entryIndex].synced = true;
    setRestockEntries(entries);
  }
};

// Helper function to generate a simple UUID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Clear local storage function
export const clearLocalStorage = (): void => {
  Object.values(KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};
