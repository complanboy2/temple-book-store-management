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
  PRINTING_INSTITUTES: "printingInstitutes",
  INSTITUTE_PERCENTAGE: "printing_institute_percentage"
};

// Enable debug mode for logging
const DEBUG = true;

// Debug logger
const logDebug = (message: string, data?: any) => {
  if (DEBUG) {
    if (data) {
      console.log(`[StorageService] ${message}`, data);
    } else {
      console.log(`[StorageService] ${message}`);
    }
  }
};

// Generic function to get items from local storage
const getItems = <T>(key: string): T[] => {
  try {
    const items = localStorage.getItem(key);
    const result = items ? JSON.parse(items) : [];
    logDebug(`Retrieved ${result.length} items from ${key}`);
    return result;
  } catch (error) {
    console.error(`Error getting items from ${key}:`, error);
    return [];
  }
};

// Generic function to set items in local storage
const setItems = <T>(key: string, items: T[]): void => {
  try {
    logDebug(`Storing ${items.length} items to ${key}`);
    localStorage.setItem(key, JSON.stringify(items));
  } catch (error) {
    console.error(`Error setting items to ${key}:`, error);
  }
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

// Sale percentage by printing institute
export const getInstituteSalePercentage = (): Record<string, number> => {
  const val = localStorage.getItem(KEYS.INSTITUTE_PERCENTAGE);
  return val ? JSON.parse(val) : {};
};
export const setInstituteSalePercentage = (obj: Record<string, number>) => {
  localStorage.setItem(KEYS.INSTITUTE_PERCENTAGE, JSON.stringify(obj));
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

// Get printing institutes
export const getPrintingInstitutes = (): string[] => {
  try {
    const storedInstitutes = localStorage.getItem('printingInstitutes');
    return storedInstitutes ? JSON.parse(storedInstitutes) : [];
  } catch (error) {
    console.error('Error getting printing institutes:', error);
    return [];
  }
};

// Set printing institutes
export const setPrintingInstitutes = (printingInstitutes: string[]): void => {
  try {
    localStorage.setItem('printingInstitutes', JSON.stringify(printingInstitutes));
  } catch (error) {
    console.error('Error setting printing institutes:', error);
  }
};

// Sample data initialization function
export const initializeSampleData = (): void => {
  // Only initialize if data doesn't exist
  const existingStalls = getBookStalls();
  if (existingStalls.length > 0) {
    console.log("Sample data already exists, skipping initialization");
    return;
  }

  console.log("Initializing sample data");
  
  // Create sample users
  const users: User[] = [
    {
      id: generateId(),
      name: "Admin User",
      email: "admin@example.com",
      phone: "9876543210",
      role: "admin",
      canSell: true,
      canRestock: true,
      instituteId: "inst-1"
    },
    {
      id: generateId(),
      name: "Regular User",
      email: "user@example.com",
      phone: "9876543211",
      role: "personnel",
      canSell: true,
      canRestock: false,
      instituteId: "inst-1"
    }
  ];
  setUsers(users);
  
  // Create sample institutes
  const institutesList: Institute[] = [
    {
      id: "inst-1",
      name: "Temple Institute",
      address: "Bangalore",
      adminId: users[0].id,
      createdAt: new Date()
    }
  ];
  setInstitutes(institutesList);
  
  // Create sample book stalls
  const bookStalls: BookStall[] = [
    {
      id: generateId(),
      name: "Main Book Stall",
      location: "Temple Entrance",
      instituteId: "inst-1",
      createdAt: new Date()
    }
  ];
  setBookStalls(bookStalls);
  
  // Create sample authors and categories
  const authors = ["Vyasa", "Valmiki", "A.C. Bhaktivedanta Swami", "Satyarth Nath", "Ramesh Kumar"];
  const categories = ["Bhagavad Gita", "Ramayana", "Vedic Literature", "Philosophy", "Children's Books"];
  const printingInstitutes = ["Vedic Press", "Bhakti Publications", "Temple Trust", "Spiritual Books Inc."];
  
  setAuthors(authors);
  setCategories(categories);
  setPrintingInstitutes(printingInstitutes);
  
  // Set sample author sale percentages
  const authorPercentages: Record<string, number> = {};
  authors.forEach(author => {
    authorPercentages[author] = Math.floor(Math.random() * 16) + 5; // 5% to 20%
  });
  setAuthorSalePercentage(authorPercentages);
  
  // Set sample printing institute percentages
  const institutePercentages: Record<string, number> = {};
  printingInstitutes.forEach(institute => {
    institutePercentages[institute] = Math.floor(Math.random() * 16) + 5; // 5% to 20%
  });
  setInstituteSalePercentage(institutePercentages);
  
  // Create sample books
  const books: Book[] = [];
  for (let i = 0; i < 15; i++) {
    const author = authors[Math.floor(Math.random() * authors.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const institute = printingInstitutes[Math.floor(Math.random() * printingInstitutes.length)];
    const originalPrice = Math.floor(Math.random() * 500) + 100; // 100 to 600
    const salePrice = Math.floor(originalPrice * (1 - Math.random() * 0.3)); // 0-30% discount
    
    books.push({
      id: generateId(),
      name: `${category} - Volume ${i + 1}`,
      author,
      category,
      printingInstitute: institute,
      originalPrice,
      salePrice,
      quantity: Math.floor(Math.random() * 20) + 5, // 5 to 25 copies
      stallId: bookStalls[0].id,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  setBooks(books);
  
  // Create sample sales
  const sales: Sale[] = [];
  for (let i = 0; i < 10; i++) {
    const book = books[Math.floor(Math.random() * books.length)];
    const quantity = Math.floor(Math.random() * 3) + 1; // 1 to 3 books per sale
    
    sales.push({
      id: generateId(),
      bookId: book.id,
      quantity,
      totalAmount: book.salePrice * quantity,
      paymentMethod: "cash",
      buyerName: `Customer ${i+1}`,
      buyerPhone: `98765432${i}`,
      personnelId: users[Math.floor(Math.random() * users.length)].id,
      stallId: bookStalls[0].id,
      synced: true,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000) // Random date in the last 30 days
    });
  }
  setSales(sales);
  
  // Create sample restock entries
  const restockEntries: RestockEntry[] = [];
  for (let i = 0; i < 5; i++) {
    const book = books[Math.floor(Math.random() * books.length)];
    const quantity = Math.floor(Math.random() * 10) + 5; // 5 to 15 books per restock
    
    restockEntries.push({
      id: generateId(),
      bookId: book.id,
      quantity,
      cost: book.originalPrice * quantity * 0.8, // 20% discount for restock
      adminId: users[0].id,
      stallId: bookStalls[0].id,
      synced: true,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000) // Random date in the last 30 days
    });
  }
  setRestockEntries(restockEntries);
  
  console.log("Sample data initialization complete");
};
