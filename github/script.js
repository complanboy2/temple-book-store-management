// Global variables
let books = [];
let cart = [];
let filteredBooks = [];

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

// Use books.json file loaded from /github/books.json
async function fetchBooks() {
    try {
        const response = await fetch('github/books.json');
        if (!response.ok) throw new Error('Failed to load static books data');
        books = await response.json();
        filteredBooks = [...books];
        document.getElementById('books-loading').classList.add('hidden');
    } catch (error) {
        console.error('Error fetching books (static):', error);
        document.getElementById('books-loading').classList.add('hidden');
        showError('Failed to load books from static file');
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
            maxQuantity: book.quantity,
            imageurl: book.imageurl // Ensure this property is included
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
        <div class="flex items-center justify-between py-3 border-b gap-3">
            <div class="w-12 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                <img 
                    src="${item.imageurl || 'https://via.placeholder.com/100x133?text=No+Image'}"
                    alt="${item.name}"
                    class="w-full h-full object-cover"
                    onerror="this.src='https://via.placeholder.com/100x133?text=No+Image'">
            </div>
            <div class="flex-1 min-w-0 pl-3">
                <h4 class="font-medium line-clamp-1 mb-0.5">${item.name}</h4>
                <p class="text-sm text-gray-600 mb-0.5">by ${item.author}</p>
                <p class="text-sm text-orange-600 mb-0.5">₹${item.price} each</p>
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

    // --- Colorful saffron title band ---
    // Saffron: #F97316
    doc.setFillColor(249, 115, 22); // Saffron
    doc.rect(0, 0, 210, 28, 'F'); // Top colored band (A4 width)
    // Add Baba image to PDF (left side, circular)
    try {
        const imgUrl = window.location.origin + "/lovable-uploads/0a0d9c2d-aa69-4479-a9f0-68dd8212603f.png";
        const resp = await fetch(imgUrl);
        const blob = await resp.blob();
        const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
        // Circle clip isn't natively supported, but shrink and border 'feel' circular
        doc.addImage(dataUrl, 'PNG', 12, 5.5, 17, 17, undefined, 'FAST');
        // Outer border (simulate circle)
        doc.setDrawColor(234, 179, 8); // Golden border
        doc.setLineWidth(1.5);
        doc.circle(20.5, 14, 8.5, 'D');
    } catch (e) {
        // graceful fallback, ignore image issues
    }

    // Title text over saffron band, slightly right to image
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(234, 179, 8); // Gold
    doc.text('Sri Nampally Baba Book Store', 34, 15.8, { baseline: 'middle' });

    // Sub-title below title
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text('- Order Invoice -', 36, 22);

    // Decorative divider
    doc.setDrawColor(234, 179, 8); // Gold
    doc.setLineWidth(0.7);
    doc.line(10, 29, 200, 29);

    // Page body background (soft yellow)
    doc.setFillColor(255, 251, 245); // #FFFBF5 (theme card)
    doc.rect(7, 32, 196, 250, 'F');

    let y = 38;

    // Customer details section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(76, 39, 18); // Rich brown
    doc.text(`Customer:`, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    doc.text(orderData.customerName, 44, y);

    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(76, 39, 18); 
    doc.text(`Phone:`, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    doc.text(orderData.customerPhone, 44, y);

    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(76, 39, 18); 
    doc.text(`Address:`, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    doc.text(orderData.customerAddress, 44, y);

    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(76, 39, 18); 
    doc.text(`Order Date:`, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    doc.text(orderData.orderDate, 44, y);

    y += 8;
    // Decorative dotted divider
    doc.setDrawColor(249, 115, 22);
    doc.setLineDashPattern([2, 2]);
    doc.line(12, y, 198, y);
    doc.setLineDashPattern([]);

    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(218, 56, 50);
    doc.text('Order Items:', 13, y);

    y += 4;
    let rowHeight = 40;

    for (const [index, item] of orderData.items.entries()) {
        // --- Fix: NBBStore/ before images/ ---
        let itemImgUrl = item.imageurl || '';
        if (itemImgUrl.startsWith('images/')) {
            itemImgUrl = 'NBBStore/' + itemImgUrl;
        } else if (itemImgUrl.startsWith('/images/')) {
            itemImgUrl = 'NBBStore' + itemImgUrl;
        }
        // Convert to absolute path if needed
        if (itemImgUrl && !/^https?:\/\//.test(itemImgUrl)) {
            itemImgUrl = window.location.origin + "/" + itemImgUrl.replace(/^\/+/, "");
        }
        let imageShown = false;
        try {
            if (itemImgUrl) {
                const imgResp = await fetch(itemImgUrl);
                const imgBlob = await imgResp.blob();
                const mimeType = imgBlob.type || "image/jpeg";
                if (mimeType.startsWith("image/")) {
                    const imgData = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = e => reject(e);
                        reader.readAsDataURL(imgBlob);
                    });
                    // Left thumbnail
                    doc.addImage(imgData, mimeType === "image/png" ? "PNG" : "JPEG",
                                 15, y + 1, 19, 25, undefined, 'FAST');
                    imageShown = true;
                    // Image outline
                    doc.setDrawColor(249, 115, 22);
                    doc.rect(15, y + 1, 19, 25, 'D');
                } else {
                    doc.setFontSize(8);
                    doc.setTextColor(220, 38, 38);
                    doc.text('-- no image --', 17, y + 15);
                }
            }
        } catch (e) {
            doc.setFontSize(8);
            doc.setTextColor(220, 38, 38);
            doc.text('-- no image --', 17, y + 15);
        }
        // Item details
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(34, 46, 64);
        doc.text(`${index + 1}. `, 37, y + 7);

        doc.setFont('helvetica', 'bold');
        doc.text(item.name, 44, y + 7);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(107, 114, 128);
        doc.text(`by ${item.author}`, 44, y + 13);

        doc.setTextColor(88, 101, 242);
        doc.text(`Qty: ${item.quantity} x ₹${item.price} = ₹${(item.quantity * item.price).toFixed(2)}`, 44, y + 20);

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.2);
        doc.line(13, y + rowHeight - 5, 195, y + rowHeight - 5);

        y += rowHeight;
        if (y > 240) {
            doc.addPage();
            // repeat background
            doc.setFillColor(255, 251, 245);
            doc.rect(7, 16, 196, 275, 'F'); // y=16 for pages except first
            y = 22;
        }
    }

    // --- Total Section ---
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(251, 146, 60);
    doc.text(`Total Amount: ₹${orderData.total.toFixed(2)}`, 13, y);
    // Golden bar
    doc.setDrawColor(234, 179, 8);
    doc.setLineWidth(1);
    doc.line(12, y + 2.7, 198, y + 2.7);

    // PDF to base64 (unchanged)
    const pdfBase64 = doc.output('datauristring');

    // WhatsApp message as before
    const message = `New Book Order from Sri Nampally Baba Book Store\n\n` +
                   `Customer: ${orderData.customerName}\n` +
                   `Phone: ${orderData.customerPhone}\n` +
                   `Address: ${orderData.customerAddress}\n\n` +
                   `Items:\n` +
                   orderData.items.map((item, index) => 
                       `${index + 1}. ${item.name} by ${item.author}\n   Qty: ${item.quantity} x ₹${item.price}`
                   ).join('\n') +
                   `\n\nTotal: ₹${orderData.total.toFixed(2)}\n\n` +
                   `Please find the detailed order PDF attached.`;

    // Open WhatsApp
    const whatsappURL = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, '_blank');

    // Download PDF
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
