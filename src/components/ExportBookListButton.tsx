
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
import { Book } from "@/types";
import { useToast } from '@/hooks/use-toast';

interface ExportBookListButtonProps {
  books: Book[];
  variant?: "download" | "print" | "both";
}

interface ExportFields {
  name: boolean;
  author: boolean;
  category: boolean;
  price: boolean;
  quantity: boolean;
  printingInstitute: boolean;
  image: boolean;
}

const ExportBookListButton: React.FC<ExportBookListButtonProps> = ({ 
  books,
  variant = "both"
}) => {
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState<ExportFields>({
    name: true,
    author: true,
    category: true,
    price: true,
    quantity: true,
    printingInstitute: false,
    image: true,
  });
  const { toast } = useToast();

  const handleFieldChange = (field: keyof ExportFields, value: boolean) => {
    setFields(prev => ({ ...prev, [field]: value }));
  };

  const generateBookListHTML = (): string => {
    const timestamp = new Date().toLocaleString();
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Book Inventory - ${timestamp}</title>
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
          .book-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
          }
          .book-item {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            display: flex;
            flex-direction: ${fields.image ? 'column' : 'row'};
            position: relative;
          }
          .book-image {
            height: ${fields.image ? '150px' : '0'};
            width: ${fields.image ? '100px' : '0'};
            object-fit: cover;
            margin-bottom: ${fields.image ? '10px' : '0'};
            border-radius: 4px;
            display: ${fields.image ? 'block' : 'none'};
          }
          .book-details {
            flex: 1;
          }
          .book-name {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 5px;
          }
          .book-meta {
            color: #666;
            font-size: 14px;
            margin-bottom: 3px;
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
        <h1>Book Inventory</h1>
        <div class="info">
          <p>Total Books: ${books.length}</p>
          <p>Generated: ${timestamp}</p>
        </div>
        <div class="book-list">
    `;

    books.forEach((book, index) => {
      html += `
        <div class="book-item">
          ${fields.image && book.imageUrl ? `<img src="${book.imageUrl}" alt="${book.name}" class="book-image" onerror="this.src='https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=300&h=400&fit=crop';this.onerror='';">` : ''}
          <div class="book-details">
            ${fields.name ? `<div class="book-name">${book.name}</div>` : ''}
            ${fields.author ? `<div class="book-meta"><strong>Author:</strong> ${book.author}</div>` : ''}
            ${fields.category ? `<div class="book-meta"><strong>Category:</strong> ${book.category || 'N/A'}</div>` : ''}
            ${fields.printingInstitute ? `<div class="book-meta"><strong>Publisher:</strong> ${book.printingInstitute || 'N/A'}</div>` : ''}
            ${fields.price ? `<div class="book-meta"><strong>Price:</strong> ₹${book.salePrice.toFixed(2)}</div>` : ''}
            ${fields.quantity ? `<div class="book-meta"><strong>In Stock:</strong> ${book.quantity}</div>` : ''}
          </div>
        </div>
        ${(index + 1) % 12 === 0 ? '<div class="page-break"></div>' : ''}
      `;
    });

    html += `
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
    const html = generateBookListHTML();
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

  const handleDownload = () => {
    const html = generateBookListHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `book-inventory-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setOpen(false);
    
    toast({
      title: "Success",
      description: "Book list downloaded successfully",
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
          {variant === "print" ? "Print" : variant === "download" ? "Download" : "Export"} Book List
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Book List</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Choose the fields you want to include in the export:
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="name" 
                checked={fields.name} 
                onCheckedChange={(checked) => handleFieldChange('name', !!checked)} 
              />
              <Label htmlFor="name">Name</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="author" 
                checked={fields.author} 
                onCheckedChange={(checked) => handleFieldChange('author', !!checked)} 
              />
              <Label htmlFor="author">Author</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="category" 
                checked={fields.category} 
                onCheckedChange={(checked) => handleFieldChange('category', !!checked)} 
              />
              <Label htmlFor="category">Category</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="price" 
                checked={fields.price} 
                onCheckedChange={(checked) => handleFieldChange('price', !!checked)} 
              />
              <Label htmlFor="price">Price</Label>
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
                id="printingInstitute" 
                checked={fields.printingInstitute} 
                onCheckedChange={(checked) => handleFieldChange('printingInstitute', !!checked)} 
              />
              <Label htmlFor="printingInstitute">Publisher</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="image" 
                checked={fields.image} 
                onCheckedChange={(checked) => handleFieldChange('image', !!checked)} 
              />
              <Label htmlFor="image">Images</Label>
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

export default ExportBookListButton;
