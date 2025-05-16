
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en/translation.json';
import hiTranslation from './locales/hi/translation.json';
import mrTranslation from './locales/mr/translation.json';
import taTranslation from './locales/ta/translation.json';
import teTranslation from './locales/te/translation.json';
import knTranslation from './locales/kn/translation.json';

// Function to merge translations with the new updates
const mergeTranslations = (baseTranslation: any, newTranslations: any) => {
  return { ...baseTranslation, ...newTranslations };
};

// Define new translations for English
const newEnTranslations = {
  common: {
    backToBooks: "Back to Books",
    bookDeleted: "Book deleted successfully",
    bookNotFound: "Book not found",
    bookStoreManager: "Book Store Management",
    booksInventory: "Books Inventory",
    clearFilters: "Clear Filters",
    createNewOrder: "Create New Order",
    createOrder: "Create Order",
    deleteBook: "Delete Book",
    deleteBookConfirmation: "Are you sure you want to delete this book?",
    deleteBookFailed: "Failed to delete book",
    failedToCreateOrder: "Failed to create order",
    failedToLoadBooks: "Failed to load books",
    failedToLoadBookDetails: "Failed to load book details",
    loading: "Loading",
    missingRequiredInformation: "Missing required information",
    newOrder: "New Order",
    noBooks: "No books found",
    notEnoughBooks: "Not enough books in stock",
    orderCreated: "Order created successfully",
    processing: "Processing",
    saveChanges: "Save Changes",
    saving: "Saving...",
    selectABook: "Please select a book",
    selectBook: "Select Book",
    templeBookStall: "Temple Book Stall",
    unknownError: "Unknown error occurred",
    welcomeToBookStore: "Welcome to Book Store",
    pleaseSelectStore: "Please select a store",
    manageMetadata: "Manage Metadata",
    storeManagement: "Store Management",
    addNewStore: "Add New Store",
    storeNameDescription: "Enter store details below",
    storeName: "Store Name",
    storeNamePlaceholder: "Enter store name",
    storeLocation: "Store Location",
    storeLocationPlaceholder: "Enter store location",
    personnel: "Personnel",
    invite: "Invite",
    inviteNewUser: "Invite New User",
    sendInvitation: "Send Invitation",
    phoneNumber: "Phone Number",
    role: "Role",
    admin: "Admin",
    generateInvite: "Generate Invite",
    inviteNewPersonnel: "Invite New Personnel",
    manageAndSellBooks: "Manage & Sell Books",
    manageYourBookInventory: "Browse, search, and manage your book inventory",
    manageOrders: "Manage Orders",
    orderManagementDescription: "Create and track book orders",
    viewOrders: "View Orders",
    analytics: "Analytics",
    trackYourStallPerformance: "Track sales and performance metrics",
    sell: "Sell",
    newSale: "New Sale",
    createNewStore: "Create a new book stall",
    more: "More",
    home: "Home",
    books: "Books",
    sales: "Sales",
    reports: "Reports",
    settings: "Settings",
    profile: "Profile",
    logout: "Logout",
    administration: "Administration",
    cancel: "Cancel",
    success: "Success",
    error: "Error",
    privacyPolicy: "Privacy Policy",
    orders: "Orders",
    quantity: "Quantity",
    author: "Author",
    category: "Category",
    edit: "Edit",
    delete: "Delete",
    optional: "Optional",
    total: "Total",
    availableQuantity: "Available Quantity",
    addBook: "Add Book",
    confirm: "Confirm",
    search: "Search",
    email: "Email",
    password: "Password",
    name: "Name",
    phone: "Phone",
    address: "Address",
    price: "Price",
    date: "Date",
    status: "Status",
    actions: "Actions",
    description: "Description",
    language: "Language",
    printingInstitute: "Printing Institute",
    selectInstitute: "Select Printing Institute",
    barcode: "Barcode",
    image: "Image",
    save: "Save",
    update: "Update",
    add: "Add",
    remove: "Remove",
    selectCategory: "Select Category",
    selectLanguage: "Select Language",
    originalPrice: "Original Price",
    salePrice: "Sale Price",
    onlyRemaining: "Only",
    left: "left",
    lowStockAlert: "Low Stock Alert",
    viewAll: "View All",
    addStore: "Add Store",
    sold: "sold",
    sellerName: "Seller",
    bookManagement: "Book Management"
  },
  dashboard: {
    revenue: "Revenue",
    lowStock: "Low Stock",
    salesToday: "Sales Today",
    totalBooks: "Total Books",
    topSellingBooks: "Top Selling Books",
    recentSales: "Recent Sales"
  },
  sell: {
    buyerName: "Buyer's Name",
    buyerPhone: "Buyer's Phone",
    cash: "Cash",
    completeSale: "Complete Sale",
    failedToCompleteSale: "Failed to complete sale",
    failedToRecordSale: "Failed to record sale",
    failedToUpdateInventory: "Failed to update inventory",
    outOfStock: "Book is out of stock",
    paymentMethod: "Payment Method",
    saleCompleted: "Sale completed successfully",
    sellerName: "Seller",
    title: "Sell Book",
    upi: "UPI",
    card: "Card"
  },
  profile: {
    email: "Email",
    enterEmail: "Enter your email",
    enterName: "Enter your name",
    enterPhone: "Enter your phone number",
    myProfile: "My Profile",
    name: "Name",
    phone: "Phone Number",
    profileUpdated: "Profile updated successfully",
    title: "Profile",
    updateFailed: "Failed to update profile"
  },
  settings: {
    title: "Settings",
    settings: "Settings",
    currentStore: "Current Store",
    language: "Language",
    theme: "Theme",
    notifications: "Notifications",
    security: "Security",
    about: "About",
    help: "Help",
    logout: "Logout"
  },
  orders: {
    createOrder: "Create Order",
    ordersList: "Orders List",
    orderDetails: "Order Details",
    customerName: "Customer Name",
    customerPhone: "Customer Phone",
    customerEmail: "Customer Email",
    orderDate: "Order Date",
    deliveryDate: "Delivery Date",
    status: "Status",
    paymentStatus: "Payment Status",
    paymentMethod: "Payment Method",
    notes: "Notes",
    addToOrder: "Add to Order",
    placeOrder: "Place Order",
    orderPlaced: "Order placed successfully",
    failedToPlaceOrder: "Failed to place order",
    selectBooks: "Select Books",
    orderTotal: "Order Total",
    noOrders: "No orders found"
  }
};

// Merge with existing translations
const resources = {
  en: {
    translation: mergeTranslations(enTranslation, newEnTranslations),
  },
  hi: {
    translation: hiTranslation,
  },
  mr: {
    translation: mrTranslation,
  },
  ta: {
    translation: taTranslation,
  },
  te: {
    translation: teTranslation,
  },
  kn: {
    translation: knTranslation,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
