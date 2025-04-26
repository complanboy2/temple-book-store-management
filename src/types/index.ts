
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
  barcode?: string;
  name: string;
  author: string;
  category: string;
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
