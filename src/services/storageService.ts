
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

// Initialize sample data for testing - remove in production
export const initializeSampleData = () => {
  if (getUsers().length === 0) {
    // Create sample admin
    const admin: User = {
      id: generateId(),
      name: "Admin User",
      email: "admin@temple.com",
      role: "admin",
      canRestock: true,
      canSell: true,
      instituteId: "inst-1",
    };
    
    // Create sample institute
    const institute: Institute = {
      id: "inst-1",
      name: "Sri Krishna Temple",
      adminId: admin.id,
      createdAt: new Date(),
    };
    
    // Create sample book stall
    const bookStall: BookStall = {
      id: "stall-1",
      name: "Main Book Stall",
      instituteId: institute.id,
      createdAt: new Date(),
    };
    
    // Create sample books
    const books: Book[] = [
      {
        id: generateId(),
        name: "Bhagavad Gita",
        author: "Vyasa",
        category: "Scripture",
        printingInstitute: "Gita Press",
        originalPrice: 150,
        salePrice: 200,
        quantity: 50,
        stallId: bookStall.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: generateId(),
        name: "Ramayana",
        author: "Valmiki",
        category: "Epic",
        printingInstitute: "Gita Press",
        originalPrice: 250,
        salePrice: 300,
        quantity: 30,
        stallId: bookStall.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: generateId(),
        name: "Mahabharata (Simplified)",
        author: "Vyasa",
        category: "Epic",
        printingInstitute: "Temple Trust",
        originalPrice: 350,
        salePrice: 400,
        quantity: 20,
        stallId: bookStall.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    
    // Store sample data
    setUsers([admin]);
    setCurrentUser(admin);
    setInstitutes([institute]);
    setBookStalls([bookStall]);
    setBooks(books);
  }
};
