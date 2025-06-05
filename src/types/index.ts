export type UserRole = "super_admin" | "admin" | "personnel";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  canRestock: boolean;
  canSell: boolean;
  instituteId: string;
  created_by_admin?: string; // Adding the missing property
}

export interface Institute {
  id: string;
  name: string;
  address?: string;
  adminId: string;
  createdAt: Date;
}

export interface BookStall {
  id: string;
  name: string;
  location?: string;
  instituteId: string;
  createdAt: Date;
}

export interface Book {
  id: string;
  bookCode?: string;
  name: string;
  author: string;
  category: string;
  language?: string;
  printingInstitute: string;
  originalPrice: number;
  salePrice: number;
  quantity: number;
  stallId: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Sale {
  id: string;
  bookId: string;
  quantity: number;
  totalAmount: number;
  paymentMethod: string;
  buyerName?: string;
  buyerPhone?: string;
  personnelId: string;
  personnelName?: string; // Adding sellerName field
  stallId: string;
  createdAt: Date;
  synced: boolean;
}

export interface RestockEntry {
  id: string;
  bookId: string;
  quantity: number;
  cost: number;
  adminId: string;
  stallId: string;
  createdAt: Date;
  synced: boolean;
}

export interface DashboardSummary {
  totalSales: number;
  totalRevenue: number;
  topSellingBooks: {
    bookId: string;
    bookName: string;
    totalSold: number;
  }[];
  lowStockItems: {
    bookId: string;
    bookName: string;
    quantity: number;
  }[];
  salesByCategory: {
    category: string;
    totalSold: number;
  }[];
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  orderDate: Date;
  deliveryDate?: Date;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  notes?: string;
  adminId: string;
  orderedBy?: string; // Person who created the order
  stallId: string;
  createdAt: Date;
  updatedAt: Date;
  synced: boolean;
  // New fields for printing institute and contact person
  printingInstituteName?: string;
  contactPersonName?: string;
  contactPersonMobile?: string;
}

export interface OrderItem {
  id: string;
  bookId: string;
  quantity: number;
  priceAtOrder: number;
  fulfilled: number;
}

export type OrderStatus = "pending" | "processing" | "fulfilled" | "cancelled" | "confirmed" | "partially_fulfilled";

export type PaymentStatus = 
  | "pending" 
  | "partially_paid" 
  | "paid" 
  | "refunded";
