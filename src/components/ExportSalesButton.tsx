import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Download, Printer } from "lucide-react";
import { Sale } from "@/types";
import { useToast } from '@/hooks/use-toast';
import { useStallContext } from '@/context/stall-context';
import { supabase } from '@/lib/supabase';

interface ExportSalesButtonProps {
  sales: Sale[];
  bookDetailsMap: Record<string, { name: string; author: string; price: number }>;
  variant?: "download" | "print" | "both";
}

interface ExportFields {
  bookName: boolean;
  bookAuthor: boolean;
  quantity: boolean;
  amount: boolean;
  date: boolean;
  paymentMethod: boolean;
  buyerInfo: boolean;
  personnel: boolean;
}

const ExportSalesButton: React.FC<ExportSalesButtonProps> = ({ 
  sales,
  bookDetailsMap,
  variant = "both"
}) => {
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState<ExportFields>({
    bookName: true,
    bookAuthor: true,
    quantity: true,
    amount: true,
    date: true,
    paymentMethod: true,
    buyerInfo: false,
    personnel: false
  });
  const { toast } = useToast();
  const { currentStore } = useStallContext();

  const handleFieldChange = (field: keyof ExportFields, value: boolean) => {
    setFields(prev => ({ ...prev, [field]: value }));
  };

  const generateSalesHTML = (): string => {
    const timestamp = new Date().toLocaleString();
    let totalRevenue = 0;
    let totalQuantity = 0;
    
    sales.forEach(sale => {
      totalRevenue += sale.totalAmount;
      totalQuantity += sale.quantity;
    });
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sales History - ${timestamp}</title>
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
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          th {
            background-color: #f5f5f5;
            color: #333;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          tr:hover {
            background-color: #f1f1f1;
          }
          .summary {
            margin-top: 30px;
            font-weight: bold;
          }
          @media print {
            .no-print {
              display: none;
            }
          }
          .page-break {
            page-break-after: always;
            break-after: page;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #888;
          }
        </style>
      </head>
      <body>
        <h1>Sales History</h1>
        <div class="info">
          <p>Total Transactions: ${sales.length}</p>
          <p>Generated: ${timestamp}</p>
        </div>
        <table>
          <thead>
            <tr>
              ${fields.date ? '<th>Date</th>' : ''}
              ${fields.bookName ? '<th>Book Title</th>' : ''}
              ${fields.bookAuthor ? '<th>Author</th>' : ''}
              ${fields.quantity ? '<th>Quantity</th>' : ''}
              ${fields.amount ? '<th>Amount</th>' : ''}
              ${fields.paymentMethod ? '<th>Payment Method</th>' : ''}
              ${fields.buyerInfo ? '<th>Buyer</th>' : ''}
              ${fields.personnel ? '<th>Sold By</th>' : ''}
            </tr>
          </thead>
          <tbody>
    `;

    sales.forEach((sale, index) => {
      const bookDetails = bookDetailsMap[sale.bookId] || { name: 'Unknown', author: 'Unknown', price: 0 };
      
      html += `
        <tr>
          ${fields.date ? `<td>${new Date(sale.createdAt).toLocaleDateString()}</td>` : ''}
          ${fields.bookName ? `<td>${bookDetails.name}</td>` : ''}
          ${fields.bookAuthor ? `<td>${bookDetails.author}</td>` : ''}
          ${fields.quantity ? `<td>${sale.quantity}</td>` : ''}
          ${fields.amount ? `<td>₹${sale.totalAmount.toFixed(2)}</td>` : ''}
          ${fields.paymentMethod ? `<td>${sale.paymentMethod}</td>` : ''}
          ${fields.buyerInfo ? `<td>${sale.buyerName || 'N/A'}${sale.buyerPhone ? ` (${sale.buyerPhone})` : ''}</td>` : ''}
          ${fields.personnel ? `<td>${sale.personnelId}</td>` : ''}
        </tr>
        ${(index + 1) % 20 === 0 ? '<tr class="page-break"><td colspan="8"></td></tr>' : ''}
      `;
    });

    html += `
          </tbody>
        </table>
        <div class="summary">
          <p>Total Items Sold: ${totalQuantity}</p>
          <p>Total Revenue: ₹${totalRevenue.toFixed(2)}</p>
        </div>
        <div class="footer">
          <p>Temple Book Stall Manager</p>
        </div>
      </body>
      </html>
    `;
    
    return html;
  };

  const handlePrint = () => {
    const html = generateSalesHTML();
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      
      // Add a slight delay to ensure content is loaded before printing
      setTimeout(() => {
        printWindow.print();
        // Don't close the window after print dialog is closed
        // This allows the user to see the preview
      }, 500);
    } else {
      toast({
        title: "Error",
        description: "Could not open print window. Please check your popup settings.",
        variant: "destructive",
      });
    }
    
    setOpen(false);
  };

  const handleDownload = async () => {
    const html = generateSalesHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Get stall name
    const { data: stallData } = await supabase
      .from('book_stalls')
      .select('name')
      .eq('id', currentStore)
      .single();
    
    const stallName = stallData?.name || 'unknown_stall';
    const date = new Date().toISOString().split('T')[0];
    const fileName = `${stallName}_${date}_sales-history.html`;
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setOpen(false);
    
    toast({
      title: "Success",
      description: "Sales history downloaded successfully",
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
            <Printer className="h-4 w-4" />
          )}
          {variant === "print" ? "Print" : variant === "download" ? "Download" : "Export"} Sales History
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Sales History</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Choose the fields you want to include in the export:
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="bookName" 
                checked={fields.bookName} 
                onCheckedChange={(checked) => handleFieldChange('bookName', !!checked)} 
              />
              <Label htmlFor="bookName">Book Title</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="bookAuthor" 
                checked={fields.bookAuthor} 
                onCheckedChange={(checked) => handleFieldChange('bookAuthor', !!checked)} 
              />
              <Label htmlFor="bookAuthor">Author</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="quantity" 
                checked={fields.quantity} 
                onCheckedChange={(checked) => handleFieldChange('quantity', !!checked)} 
              />
              <Label htmlFor="quantity">Quantity</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="amount" 
                checked={fields.amount} 
                onCheckedChange={(checked) => handleFieldChange('amount', !!checked)} 
              />
              <Label htmlFor="amount">Amount</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="date" 
                checked={fields.date} 
                onCheckedChange={(checked) => handleFieldChange('date', !!checked)} 
              />
              <Label htmlFor="date">Date</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="paymentMethod" 
                checked={fields.paymentMethod} 
                onCheckedChange={(checked) => handleFieldChange('paymentMethod', !!checked)} 
              />
              <Label htmlFor="paymentMethod">Payment Method</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="buyerInfo" 
                checked={fields.buyerInfo} 
                onCheckedChange={(checked) => handleFieldChange('buyerInfo', !!checked)} 
              />
              <Label htmlFor="buyerInfo">Buyer Information</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="personnel" 
                checked={fields.personnel} 
                onCheckedChange={(checked) => handleFieldChange('personnel', !!checked)} 
              />
              <Label htmlFor="personnel">Sold By</Label>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          
          <div className="flex gap-2">
            {variant !== "download" && (
              <Button
                onClick={handlePrint}
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
            )}
            
            {variant !== "print" && (
              <Button
                onClick={handleDownload}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportSalesButton;
