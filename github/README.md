
# Temple Book Store - Public Catalog

This is a standalone public catalog for the Temple Book Store that can be deployed to GitHub Pages. It allows public users to browse books, add them to cart, and place orders via WhatsApp.

## Features

- Browse all books from the Temple Book Store database
- Search and filter books by name, author, category
- Add books to shopping cart
- Customer checkout with order form
- Automatic PDF generation of order details
- WhatsApp integration for order submission

## Setup

1. Copy all files from this `github` folder to a new repository
2. Enable GitHub Pages in repository settings
3. The site will be available at `https://yourusername.github.io/repository-name`

## Files

- `index.html` - Main page with book catalog and shopping cart
- `script.js` - JavaScript functionality for the entire application
- `README.md` - This documentation file

## How it works

1. Users can browse books fetched from the Supabase database
2. Books can be filtered by category, author, or searched by name
3. Users add books to their cart and proceed to checkout
4. During checkout, users enter their details (name, phone, address)
5. On order placement, a PDF is generated with order details
6. WhatsApp opens with order information and the PDF is downloaded
7. Store owners receive the order via WhatsApp

## Technical Details

- Pure HTML/CSS/JavaScript (no build process required)
- Uses Tailwind CSS via CDN for styling
- jsPDF library for PDF generation
- Direct integration with Supabase REST API
- Responsive design for mobile and desktop

## Deployment

Simply push the files to a GitHub repository and enable GitHub Pages. The site will automatically be available at your GitHub Pages URL.
