
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Download,
  FileText,
  FileCsv,
  Printer
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from "react-i18next";
import { format } from 'date-fns';

export interface BookReportData {
  id: string;
  name: string;
  author: string;
  price: number;
  quantity: number;
  quantitySold?: number;
  category?: string;
  printingInstitute?: string;
  imageurl?: string;
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

interface ExportFields {
  name: boolean;
  author: boolean;
  category: boolean;
  price: boolean;
  quantity: boolean;
  quantitySold: boolean;
  printingInstitute: boolean;
  image: boolean;
  date: boolean;
  seller: boolean;
  buyer: boolean;
  paymentMethod: boolean;
}

interface ExportReportButtonProps {
  bookData?: BookReportData[];
  salesData?: SalesReportData[];
  variant?: "download" | "print" | "both";
  reportType: "inventory" | "sales";
  dateRange?: { from: Date | null; to: Date | null };
}

const ExportReportButton: React.FC<ExportReportButtonProps> = ({ 
  bookData = [],
  salesData = [],
  variant = "both",
  reportType,
  dateRange
}) => {
  const [open, setOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "csv">("pdf");
  const [fields, setFields] = useState<ExportFields>({
    name: true,
    author: true,
    category: true,
    price: true,
    quantity: true,
    quantitySold: reportType === "inventory" ? true : false,
    printingInstitute: false,
    image: true,
    date: reportType === "sales" ? true : false,
    seller: reportType === "sales" ? true : false,
    buyer: reportType === "sales" ? false : false,
    paymentMethod: reportType === "sales" ? true : false,
  });
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleFieldChange = (field: keyof ExportFields, value: boolean) => {
    setFields(prev => ({ ...prev, [field]: value }));
  };

  const generateHTML = (): string => {
    const timestamp = new Date().toLocaleString();
    const title = reportType === "inventory" ? t("report.inventoryReport") : t("report.salesReport");
    const dateRangeText = dateRange?.from && dateRange?.to 
      ? `${format(dateRange.from, 'yyyy-MM-dd')} to ${format(dateRange.to, 'yyyy-MM-dd')}` 
      : '';
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title} - ${timestamp}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
          }
          h1 {
            color: #7b1fa2;
            margin-bottom: 20px;
          }
          .info {
            color: #666;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #888;
          }
          .book-image {
            height: 50px;
            width: 40px;
            object-fit: cover;
            border-radius: 4px;
          }
          @media print {
            .no-print {
              display: none;
            }
            @page {
              margin: 1cm;
            }
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="info">
          <p>${dateRangeText ? `Date Range: ${dateRangeText}` : ''}</p>
          <p>Generated: ${timestamp}</p>
        </div>
        <table>
          <thead>
            <tr>
    `;

    // Add table headers based on report type and selected fields
    if (reportType === "inventory") {
      if (fields.image) html += `<th>Image</th>`;
      if (fields.name) html += `<th>Book Name</th>`;
      if (fields.author) html += `<th>Author</th>`;
      if (fields.category) html += `<th>Category</th>`;
      if (fields.printingInstitute) html += `<th>Publisher</th>`;
      if (fields.price) html += `<th>Price</th>`;
      if (fields.quantity) html += `<th>In Stock</th>`;
      if (fields.quantitySold) html += `<th>Sold</th>`;
    } else {
      // Sales report headers
      if (fields.image) html += `<th>Image</th>`;
      if (fields.name) html += `<th>Book Name</th>`;
      if (fields.author) html += `<th>Author</th>`;
      if (fields.price) html += `<th>Price</th>`;
      if (fields.quantity) html += `<th>Quantity</th>`;
      if (fields.date) html += `<th>Date</th>`;
      if (fields.seller) html += `<th>Seller</th>`;
      if (fields.buyer) html += `<th>Buyer</th>`;
      if (fields.paymentMethod) html += `<th>Payment Method</th>`;
    }

    html += `
            </tr>
          </thead>
          <tbody>
    `;

    // Add table rows based on report type
    if (reportType === "inventory" && bookData.length > 0) {
      bookData.forEach(book => {
        html += '<tr>';
        if (fields.image) html += `<td>${book.imageurl ? `<img src="${book.imageurl}" alt="${book.name}" class="book-image" onerror="this.src='https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=300&h=400&fit=crop';this.onerror='';">` : ''}</td>`;
        if (fields.name) html += `<td>${book.name}</td>`;
        if (fields.author) html += `<td>${book.author}</td>`;
        if (fields.category) html += `<td>${book.category || 'N/A'}</td>`;
        if (fields.printingInstitute) html += `<td>${book.printingInstitute || 'N/A'}</td>`;
        if (fields.price) html += `<td>₹${book.price.toFixed(2)}</td>`;
        if (fields.quantity) html += `<td>${book.quantity}</td>`;
        if (fields.quantitySold) html += `<td>${book.quantitySold || 0}</td>`;
        html += '</tr>';
      });
    } else if (reportType === "sales" && salesData.length > 0) {
      salesData.forEach(sale => {
        html += '<tr>';
        if (fields.image) html += `<td>${sale.imageurl ? `<img src="${sale.imageurl}" alt="${sale.bookName}" class="book-image" onerror="this.src='https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=300&h=400&fit=crop';this.onerror='';">` : ''}</td>`;
        if (fields.name) html += `<td>${sale.bookName}</td>`;
        if (fields.author) html += `<td>${sale.author}</td>`;
        if (fields.price) html += `<td>₹${sale.price.toFixed(2)}</td>`;
        if (fields.quantity) html += `<td>${sale.quantity}</td>`;
        if (fields.date) html += `<td>${format(new Date(sale.date), 'yyyy-MM-dd')}</td>`;
        if (fields.seller) html += `<td>${sale.sellerName || 'N/A'}</td>`;
        if (fields.buyer) html += `<td>${sale.buyerName || 'N/A'}</td>`;
        if (fields.paymentMethod) html += `<td>${sale.paymentMethod}</td>`;
        html += '</tr>';
      });
    }

    html += `
          </tbody>
        </table>
        <div class="footer">
          <p>Temple Book Stall Manager</p>
        </div>
      </body>
      </html>
    `;
    
    return html;
  };

  const generateCSV = (): string => {
    let headers: string[] = [];
    let rows: string[][] = [];

    // Define headers based on report type and selected fields
    if (reportType === "inventory") {
      if (fields.name) headers.push('Book Name');
      if (fields.author) headers.push('Author');
      if (fields.category) headers.push('Category');
      if (fields.printingInstitute) headers.push('Publisher');
      if (fields.price) headers.push('Price');
      if (fields.quantity) headers.push('In Stock');
      if (fields.quantitySold) headers.push('Sold');
      
      // Generate rows for inventory
      bookData.forEach(book => {
        const row: string[] = [];
        if (fields.name) row.push(book.name);
        if (fields.author) row.push(book.author);
        if (fields.category) row.push(book.category || 'N/A');
        if (fields.printingInstitute) row.push(book.printingInstitute || 'N/A');
        if (fields.price) row.push(book.price.toFixed(2));
        if (fields.quantity) row.push(book.quantity.toString());
        if (fields.quantitySold) row.push((book.quantitySold || 0).toString());
        rows.push(row);
      });
    } else {
      // Sales report
      if (fields.name) headers.push('Book Name');
      if (fields.author) headers.push('Author');
      if (fields.price) headers.push('Price');
      if (fields.quantity) headers.push('Quantity');
      if (fields.date) headers.push('Date');
      if (fields.seller) headers.push('Seller');
      if (fields.buyer) headers.push('Buyer');
      if (fields.paymentMethod) headers.push('Payment Method');
      
      // Generate rows for sales
      salesData.forEach(sale => {
        const row: string[] = [];
        if (fields.name) row.push(sale.bookName);
        if (fields.author) row.push(sale.author);
        if (fields.price) row.push(sale.price.toFixed(2));
        if (fields.quantity) row.push(sale.quantity.toString());
        if (fields.date) row.push(format(new Date(sale.date), 'yyyy-MM-dd'));
        if (fields.seller) row.push(sale.sellerName || 'N/A');
        if (fields.buyer) row.push(sale.buyerName || 'N/A');
        if (fields.paymentMethod) row.push(sale.paymentMethod);
        rows.push(row);
      });
    }

    // Convert to CSV format
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(cell => {
        // Escape commas and quotes
        if (cell.includes(',') || cell.includes('"')) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',') + '\n';
    });

    return csvContent;
  };

  const handlePrint = () => {
    const html = generateHTML();
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      
      // Add a slight delay to ensure content is loaded before printing
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } else {
      toast({
        title: t("common.error"),
        description: t("common.printError"),
        variant: "destructive",
      });
    }
    
    setOpen(false);
  };

  const handleDownload = () => {
    if (exportFormat === "pdf") {
      const html = generateHTML();
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const reportTypeFileName = reportType === "inventory" ? "inventory-report" : "sales-report";
      a.href = url;
      a.download = `${reportTypeFileName}-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      const csvContent = generateCSV();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const reportTypeFileName = reportType === "inventory" ? "inventory-report" : "sales-report";
      a.href = url;
      a.download = `${reportTypeFileName}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    
    setOpen(false);
    
    toast({
      title: t("common.success"),
      description: t("report.exportSuccess"),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline"
          className="flex items-center gap-2"
        >
          {variant === "print" ? (
            <Printer className="h-4 w-4" />
          ) : variant === "download" ? (
            <Download className="h-4 w-4" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          {reportType === "inventory" ? t("report.exportInventory") : t("report.exportSales")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {reportType === "inventory" ? t("report.exportInventory") : t("report.exportSales")}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
          <div className="flex justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <input 
                type="radio" 
                id="pdf" 
                name="exportFormat" 
                value="pdf"
                checked={exportFormat === "pdf"}
                onChange={() => setExportFormat("pdf")}
                className="h-4 w-4"
              />
              <Label htmlFor="pdf">PDF/HTML</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input 
                type="radio" 
                id="csv" 
                name="exportFormat" 
                value="csv"
                checked={exportFormat === "csv"}
                onChange={() => setExportFormat("csv")}
                className="h-4 w-4"
              />
              <Label htmlFor="csv">CSV</Label>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              {t("report.selectFields")}:
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="name" 
                  checked={fields.name} 
                  onCheckedChange={(checked) => handleFieldChange('name', !!checked)} 
                />
                <Label htmlFor="name">{t("common.name")}</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="author" 
                  checked={fields.author} 
                  onCheckedChange={(checked) => handleFieldChange('author', !!checked)} 
                />
                <Label htmlFor="author">{t("common.author")}</Label>
              </div>
              
              {reportType === "inventory" && (
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="category" 
                    checked={fields.category} 
                    onCheckedChange={(checked) => handleFieldChange('category', !!checked)} 
                  />
                  <Label htmlFor="category">{t("common.category")}</Label>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="price" 
                  checked={fields.price} 
                  onCheckedChange={(checked) => handleFieldChange('price', !!checked)} 
                />
                <Label htmlFor="price">{t("common.price")}</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="quantity" 
                  checked={fields.quantity} 
                  onCheckedChange={(checked) => handleFieldChange('quantity', !!checked)} 
                />
                <Label htmlFor="quantity">{t("common.quantity")}</Label>
              </div>
              
              {reportType === "inventory" && (
                <>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="quantitySold" 
                      checked={fields.quantitySold} 
                      onCheckedChange={(checked) => handleFieldChange('quantitySold', !!checked)} 
                    />
                    <Label htmlFor="quantitySold">{t("report.quantitySold")}</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="printingInstitute" 
                      checked={fields.printingInstitute} 
                      onCheckedChange={(checked) => handleFieldChange('printingInstitute', !!checked)} 
                    />
                    <Label htmlFor="printingInstitute">{t("common.publisher")}</Label>
                  </div>
                </>
              )}
              
              {reportType === "sales" && (
                <>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="date" 
                      checked={fields.date} 
                      onCheckedChange={(checked) => handleFieldChange('date', !!checked)} 
                    />
                    <Label htmlFor="date">{t("common.date")}</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="seller" 
                      checked={fields.seller} 
                      onCheckedChange={(checked) => handleFieldChange('seller', !!checked)} 
                    />
                    <Label htmlFor="seller">{t("common.seller")}</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="buyer" 
                      checked={fields.buyer} 
                      onCheckedChange={(checked) => handleFieldChange('buyer', !!checked)} 
                    />
                    <Label htmlFor="buyer">{t("common.buyer")}</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="paymentMethod" 
                      checked={fields.paymentMethod} 
                      onCheckedChange={(checked) => handleFieldChange('paymentMethod', !!checked)} 
                    />
                    <Label htmlFor="paymentMethod">{t("common.paymentMethod")}</Label>
                  </div>
                </>
              )}
              
              {exportFormat === "pdf" && (
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="image" 
                    checked={fields.image} 
                    onCheckedChange={(checked) => handleFieldChange('image', !!checked)} 
                  />
                  <Label htmlFor="image">{t("common.images")}</Label>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
          >
            {t("common.cancel")}
          </Button>
          
          <div className="flex gap-2">
            {variant !== "download" && (
              <Button
                onClick={handlePrint}
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                {t("common.print")}
              </Button>
            )}
            
            {variant !== "print" && (
              <Button
                onClick={handleDownload}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {exportFormat === "pdf" ? t("common.downloadPDF") : t("common.downloadCSV")}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportReportButton;
