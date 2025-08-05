
import React, { useState, useEffect } from 'react';
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
import { useStallContext } from '@/contexts/StallContext';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';

interface ExportSalesButtonProps {
  sales: Sale[];
  bookDetailsMap: Record<string, { name: string; author: string; price: number; imageUrl?: string }>;
  variant?: "download" | "print" | "both";
}

interface ExportFields {
  bookName: boolean;
  bookAuthor: boolean;
  bookId: boolean;
  imageUrl: boolean;
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
    bookId: true,
    imageUrl: true,
    quantity: true,
    amount: true,
    date: true,
    paymentMethod: true,
    buyerInfo: false,
    personnel: false
  });
  const [personnelNames, setPersonnelNames] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { currentStore } = useStallContext();
  const { t } = useTranslation();

  // Auto-close toast function
  const showToast = (title: string, description: string, variant: "default" | "destructive" = "default") => {
    toast({
      title,
      description,
      variant,
      duration: 5000, // Auto-close after 5 seconds
    });
  };

  useEffect(() => {
    const fetchPersonnelData = async () => {
      if (!currentStore) return;
      
      try {
        // Query the users table to get personnel information
        const { data, error } = await supabase
          .from('users')
          .select('email, name')
          .eq('instituteid', currentStore);
          
        if (error) throw error;
        
        const nameMap: Record<string, string> = {};
        if (data) {
          data.forEach(person => {
            nameMap[person.email] = person.name;
          });
        }
        
        setPersonnelNames(nameMap);
      } catch (error) {
        console.error("Error fetching personnel data:", error);
      }
    };
    
    fetchPersonnelData();
  }, [currentStore]);

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
            font-size: 12px;
            vertical-align: middle;
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
            img.book-thumb {
              max-width: 60px;
              max-height: 80px;
            }
          }
          .book-id {
            font-family: monospace;
            font-size: 10px;
          }
          .image-url {
            word-break: break-all;
            font-size: 10px;
            color: #666;
          }
          img.book-thumb {
            max-width: 60px;
            max-height: 80px;
            border-radius: 4px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.12);
            margin-right: 4px;
            background: #eef;
          }
        </style>
      </head>
       <body>
         <h1>${t('salesExport.salesHistory')}</h1>
         <div class="info">
           <p>${t('salesExport.totalTransactions')}: ${sales.length}</p>
           <p>${t('salesExport.generated')}: ${timestamp}</p>
         </div>
        <table>
          <thead>
             <tr>
               ${fields.date ? `<th>${t('salesExport.date')}</th>` : ''}
               ${fields.bookName ? `<th>${t('salesExport.bookTitle')}</th>` : ''}
               ${fields.bookAuthor ? `<th>${t('salesExport.author')}</th>` : ''}
               ${fields.bookId ? `<th>${t('salesExport.bookId')}</th>` : ''}
               ${fields.imageUrl ? `<th>${t('salesExport.image')}</th>` : ''}
               ${fields.quantity ? `<th>${t('salesExport.quantity')}</th>` : ''}
               ${fields.amount ? `<th>${t('salesExport.amount')}</th>` : ''}
               ${fields.paymentMethod ? `<th>${t('salesExport.paymentMethod')}</th>` : ''}
               ${fields.buyerInfo ? `<th>${t('salesExport.buyer')}</th>` : ''}
               ${fields.personnel ? `<th>${t('salesExport.soldBy')}</th>` : ''}
             </tr>
          </thead>
          <tbody>
    `;

    sales.forEach((sale, index) => {
      const bookDetails = bookDetailsMap[sale.bookId] || { name: 'Unknown', author: 'Unknown', price: 0, imageUrl: '' };
      const sellerName = personnelNames[sale.personnelId] || sale.personnelId || 'Unknown';

      html += `
        <tr>
          ${fields.date ? `<td>${new Date(sale.createdAt).toLocaleDateString()}</td>` : ''}
          ${fields.bookName ? `<td>${bookDetails.name}</td>` : ''}
          ${fields.bookAuthor ? `<td>${bookDetails.author}</td>` : ''}
          ${fields.bookId ? `<td class="book-id">${sale.bookId}</td>` : ''}
          ${fields.imageUrl ? `<td>
             ${
               bookDetails.imageUrl
                 ? `<img src="${bookDetails.imageUrl}" alt="Book Cover" class="book-thumb" onerror="this.style.display='none'" />`
                 : `<span style="color:#bbb;font-size:10px;">${t('salesExport.noImage')}</span>`
             }
             <br/>
             <span class="image-url">${bookDetails.imageUrl || t('salesExport.na')}</span>
          </td>` : ''}
          ${fields.quantity ? `<td>${sale.quantity}</td>` : ''}
          ${fields.amount ? `<td>₹${sale.totalAmount.toFixed(2)}</td>` : ''}
           ${fields.paymentMethod ? `<td>${sale.paymentMethod}</td>` : ''}
           ${fields.buyerInfo ? `<td>${sale.buyerName || t('salesExport.na')}${sale.buyerPhone ? ` (${sale.buyerPhone})` : ''}</td>` : ''}
           ${fields.personnel ? `<td>${sellerName}</td>` : ''}
        </tr>
        ${(index + 1) % 20 === 0 ? '<tr class="page-break"><td colspan="10"></td></tr>' : ''}
      `;
    });

    html += `
          </tbody>
        </table>
         <div class="summary">
           <p>${t('salesExport.totalItemsSold')}: ${totalQuantity}</p>
           <p>${t('salesExport.totalRevenue')}: ₹${totalRevenue.toFixed(2)}</p>
         </div>
         <div class="footer">
           <p>${t('salesExport.templeBookStallManager')}</p>
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
      showToast(t('salesExport.error'), t('salesExport.couldNotOpenPrintWindow'), "destructive");
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
    
    showToast(t('salesExport.success'), t('salesExport.salesHistoryDownloadedSuccessfully'));
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
          {variant === "print" ? t('salesExport.print') : variant === "download" ? t('salesExport.download') : t('salesExport.export')} {t('salesExport.salesHistory')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('salesExport.exportSalesHistory')}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            {t('salesExport.chooseFields')}
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="bookName" 
                checked={fields.bookName} 
                onCheckedChange={(checked) => handleFieldChange('bookName', !!checked)} 
              />
              <Label htmlFor="bookName">{t('salesExport.bookTitle')}</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="bookAuthor" 
                checked={fields.bookAuthor} 
                onCheckedChange={(checked) => handleFieldChange('bookAuthor', !!checked)} 
              />
              <Label htmlFor="bookAuthor">{t('salesExport.author')}</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="bookId" 
                checked={fields.bookId} 
                onCheckedChange={(checked) => handleFieldChange('bookId', !!checked)} 
              />
              <Label htmlFor="bookId">{t('salesExport.bookId')}</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="imageUrl" 
                checked={fields.imageUrl} 
                onCheckedChange={(checked) => handleFieldChange('imageUrl', !!checked)} 
              />
              <Label htmlFor="imageUrl">{t('salesExport.imageUrl')}</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="quantity" 
                checked={fields.quantity} 
                onCheckedChange={(checked) => handleFieldChange('quantity', !!checked)} 
              />
              <Label htmlFor="quantity">{t('salesExport.quantity')}</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="amount" 
                checked={fields.amount} 
                onCheckedChange={(checked) => handleFieldChange('amount', !!checked)} 
              />
              <Label htmlFor="amount">{t('salesExport.amount')}</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="date" 
                checked={fields.date} 
                onCheckedChange={(checked) => handleFieldChange('date', !!checked)} 
              />
              <Label htmlFor="date">{t('salesExport.date')}</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="paymentMethod" 
                checked={fields.paymentMethod} 
                onCheckedChange={(checked) => handleFieldChange('paymentMethod', !!checked)} 
              />
              <Label htmlFor="paymentMethod">{t('salesExport.paymentMethod')}</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="buyerInfo" 
                checked={fields.buyerInfo} 
                onCheckedChange={(checked) => handleFieldChange('buyerInfo', !!checked)} 
              />
              <Label htmlFor="buyerInfo">{t('salesExport.buyerInformation')}</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="personnel" 
                checked={fields.personnel} 
                onCheckedChange={(checked) => handleFieldChange('personnel', !!checked)} 
              />
              <Label htmlFor="personnel">{t('salesExport.soldBy')}</Label>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
          >
            {t('salesExport.cancel')}
          </Button>
          
          <div className="flex gap-2">
            {variant !== "download" && (
              <Button
                onClick={handlePrint}
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                {t('salesExport.print')}
              </Button>
            )}
            
            {variant !== "print" && (
              <Button
                onClick={handleDownload}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {t('salesExport.download')}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportSalesButton;
