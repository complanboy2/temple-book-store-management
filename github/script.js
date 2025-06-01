
// Global variables
let books = [];
let cart = [];
let filteredBooks = [];

// API Configuration
const SUPABASE_URL = 'https://pijhrmuamnwdgucfnycl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpamhybXVhbW53ZGd1Y2ZueWNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNDk1NTAsImV4cCI6MjA2MDgyNTU1MH0.qf5P5eWDSLRmFKxIwtqBygxNAvIFtqGxJN3J4nX7ocE';

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

async function initializeApp() {
    try {
        await fetchBooks();
        setupFilters();
        displayBooks();
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Failed to load books. Please try again later.');
    }
}

async function fetchBooks() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/books?select=*`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch books');
        }

        books = await response.json();
        filteredBooks = [...books];
        
        document.getElementById('books-loading').classList.add('hidden');
        
    } catch (error) {
        console.error('Error fetching books:', error);
        document.getElementById('books-loading').classList.add('hidden');
        showError('Failed to load books from server');
    }
}

function setupFilters() {
    // Setup category filter
    const categories = [...new Set(books.map(book => book.category).filter(Boolean))];
    const categorySelect = document.getElementById('category-filter');
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });

    // Setup author filter
    const authors = [...new Set(books.map(book => book.author).filter(Boolean))];
    const authorSelect = document.getElementById('author-filter');
    authors.forEach(author => {
        const option = document.createElement('option');
        option.value = author;
        option.textContent = author;
        authorSelect.appendChild(option);
    });
}

function setupEventListeners() {
    // Search and filter listeners
    document.getElementById('search-input').addEventListener('input', applyFilters);
    document.getElementById('category-filter').addEventListener('change', applyFilters);
    document.getElementById('author-filter').addEventListener('change', applyFilters);

    // Cart listeners
    document.getElementById('view-cart-btn').addEventListener('click', showCart);
    document.getElementById('close-cart').addEventListener('click', hideCart);
    document.getElementById('checkout-btn').addEventListener('click', showCheckout);
    document.getElementById('cancel-checkout').addEventListener('click', hideCheckout);
    document.getElementById('place-order').addEventListener('click', placeOrder);

    // Modal background click to close
    document.getElementById('cart-modal').addEventListener('click', function(e) {
        if (e.target === this) hideCart();
    });
    document.getElementById('checkout-modal').addEventListener('click', function(e) {
        if (e.target === this) hideCheckout();
    });
}

function applyFilters() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const selectedCategory = document.getElementById('category-filter').value;
    const selectedAuthor = document.getElementById('author-filter').value;

    filteredBooks = books.filter(book => {
        const matchesSearch = !searchTerm || 
            book.name.toLowerCase().includes(searchTerm) ||
            book.author.toLowerCase().includes(searchTerm) ||
            (book.bookcode && book.bookcode.toLowerCase().includes(searchTerm));
        
        const matchesCategory = !selectedCategory || book.category === selectedCategory;
        const matchesAuthor = !selectedAuthor || book.author === selectedAuthor;

        return matchesSearch && matchesCategory && matchesAuthor;
    });

    displayBooks();
}

function displayBooks() {
    const booksGrid = document.getElementById('books-grid');
    const noBooksMessage = document.getElementById('no-books');
    
    if (filteredBooks.length === 0) {
        booksGrid.classList.add('hidden');
        noBooksMessage.classList.remove('hidden');
        return;
    }

    noBooksMessage.classList.add('hidden');
    booksGrid.classList.remove('hidden');
    
    booksGrid.innerHTML = filteredBooks.map(book => `
        <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div class="aspect-w-3 aspect-h-4 bg-gray-200">
                <img src="${book.imageurl || 'https://via.placeholder.com/300x400?text=No+Image'}" 
                     alt="${book.name}" 
                     class="w-full h-48 object-cover"
                     onerror="this.src='https://via.placeholder.com/300x400?text=No+Image'">
            </div>
            <div class="p-4">
                <h3 class="font-semibold text-gray-900 mb-1 line-clamp-2">${book.name}</h3>
                <p class="text-sm text-gray-600 mb-2">by ${book.author}</p>
                ${book.category ? `<p class="text-xs text-gray-500 mb-2">${book.category}</p>` : ''}
                <div class="flex justify-between items-center mb-3">
                    <span class="text-lg font-bold text-orange-600">₹${book.saleprice}</span>
                    <span class="text-sm text-gray-500">Stock: ${book.quantity}</span>
                </div>
                <button onclick="addToCart('${book.id}')" 
                        ${book.quantity <= 0 ? 'disabled' : ''}
                        class="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed">
                    ${book.quantity <= 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
            </div>
        </div>
    `).join('');
}

function addToCart(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book || book.quantity <= 0) return;

    const existingItem = cart.find(item => item.id === bookId);
    if (existingItem) {
        if (existingItem.quantity < book.quantity) {
            existingItem.quantity++;
        } else {
            alert('Cannot add more items. Not enough stock available.');
            return;
        }
    } else {
        cart.push({
            id: book.id,
            name: book.name,
            author: book.author,
            price: book.saleprice,
            quantity: 1,
            maxQuantity: book.quantity
        });
    }

    updateCartUI();
    showNotification(`${book.name} added to cart!`);
}

function removeFromCart(bookId) {
    cart = cart.filter(item => item.id !== bookId);
    updateCartUI();
    updateCartModal();
}

function updateCartQuantity(bookId, newQuantity) {
    const item = cart.find(item => item.id === bookId);
    if (!item) return;

    if (newQuantity <= 0) {
        removeFromCart(bookId);
        return;
    }

    if (newQuantity > item.maxQuantity) {
        alert('Cannot add more items. Not enough stock available.');
        return;
    }

    item.quantity = newQuantity;
    updateCartUI();
    updateCartModal();
}

function updateCartUI() {
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-count').textContent = `Cart: ${cartCount} items`;
    
    const viewCartBtn = document.getElementById('view-cart-btn');
    viewCartBtn.disabled = cartCount === 0;
}

function showCart() {
    updateCartModal();
    document.getElementById('cart-modal').classList.remove('hidden');
}

function hideCart() {
    document.getElementById('cart-modal').classList.add('hidden');
}

function updateCartModal() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');

    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="text-gray-500 text-center py-4">Your cart is empty</p>';
        cartTotal.textContent = '0';
        checkoutBtn.disabled = true;
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = total.toFixed(2);
    checkoutBtn.disabled = false;

    cartItems.innerHTML = cart.map(item => `
        <div class="flex items-center justify-between py-3 border-b">
            <div class="flex-1">
                <h4 class="font-medium">${item.name}</h4>
                <p class="text-sm text-gray-600">by ${item.author}</p>
                <p class="text-sm text-orange-600">₹${item.price} each</p>
            </div>
            <div class="flex items-center gap-2">
                <button onclick="updateCartQuantity('${item.id}', ${item.quantity - 1})" 
                        class="px-2 py-1 border rounded">-</button>
                <span class="px-3">${item.quantity}</span>
                <button onclick="updateCartQuantity('${item.id}', ${item.quantity + 1})" 
                        class="px-2 py-1 border rounded">+</button>
                <button onclick="removeFromCart('${item.id}')" 
                        class="ml-2 text-red-600 hover:text-red-800">Remove</button>
            </div>
        </div>
    `).join('');
}

function showCheckout() {
    hideCart();
    document.getElementById('checkout-modal').classList.remove('hidden');
}

function hideCheckout() {
    document.getElementById('checkout-modal').classList.add('hidden');
}

async function placeOrder() {
    const name = document.getElementById('customer-name').value.trim();
    const phone = document.getElementById('customer-phone').value.trim();
    const address = document.getElementById('customer-address').value.trim();

    if (!name || !phone || !address) {
        alert('Please fill in all required fields.');
        return;
    }

    try {
        const orderData = {
            customerName: name,
            customerPhone: phone,
            customerAddress: address,
            items: cart,
            total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            orderDate: new Date().toLocaleDateString()
        };

        await generatePDFAndOpenWhatsApp(orderData);
        
        // Clear cart and close modal
        cart = [];
        updateCartUI();
        hideCheckout();
        
        showNotification('Order details sent to WhatsApp!');
    } catch (error) {
        console.error('Error placing order:', error);
        alert('Failed to process order. Please try again.');
    }
}

async function generatePDFAndOpenWhatsApp(orderData) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(20);
    doc.text('Temple Book Store - Order', 20, 20);

    // Add customer details
    doc.setFontSize(12);
    doc.text(`Customer: ${orderData.customerName}`, 20, 40);
    doc.text(`Phone: ${orderData.customerPhone}`, 20, 50);
    doc.text(`Address: ${orderData.customerAddress}`, 20, 60);
    doc.text(`Order Date: ${orderData.orderDate}`, 20, 70);

    // Add items
    doc.text('Order Items:', 20, 90);
    let yPosition = 100;
    
    orderData.items.forEach((item, index) => {
        doc.text(`${index + 1}. ${item.name}`, 20, yPosition);
        doc.text(`   Author: ${item.author}`, 20, yPosition + 10);
        doc.text(`   Quantity: ${item.quantity} x ₹${item.price} = ₹${(item.quantity * item.price).toFixed(2)}`, 20, yPosition + 20);
        yPosition += 35;
    });

    // Add total
    doc.setFontSize(14);
    doc.text(`Total Amount: ₹${orderData.total.toFixed(2)}`, 20, yPosition + 10);

    // Convert PDF to base64
    const pdfBase64 = doc.output('datauristring');
    
    // Create WhatsApp message
    const message = `New Book Order from Temple Book Store\n\n` +
                   `Customer: ${orderData.customerName}\n` +
                   `Phone: ${orderData.customerPhone}\n` +
                   `Address: ${orderData.customerAddress}\n\n` +
                   `Items:\n` +
                   orderData.items.map((item, index) => 
                       `${index + 1}. ${item.name} by ${item.author}\n   Qty: ${item.quantity} x ₹${item.price}`
                   ).join('\n') +
                   `\n\nTotal: ₹${orderData.total.toFixed(2)}\n\n` +
                   `Please find the detailed order PDF attached.`;

    // Open WhatsApp with the message
    const whatsappURL = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, '_blank');

    // Also download the PDF
    doc.save(`Order_${orderData.customerName}_${Date.now()}.pdf`);
}

function showNotification(message) {
    // Create and show a simple notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        document.body.removeChild(notification);
    }, 3000);
}

function showError(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        document.body.removeChild(notification);
    }, 5000);
}
