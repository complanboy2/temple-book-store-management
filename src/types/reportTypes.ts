
export interface BookReportData {
  id: string;
  name: string;
  author: string;
  price: number;
  quantity: number;
  category: string;
  printingInstitute: string;
  imageurl?: string;
  quantitySold: number;
}

export interface SalesReportData {
  id: string;
  bookName: string;
  author: string;
  price: number;
  quantity: number;
  totalAmount: number;
  date: Date;
  buyerName?: string;
  sellerName?: string;
  paymentMethod: string;
  imageurl?: string;
}
