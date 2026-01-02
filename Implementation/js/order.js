// order.js
const menuData = {
    starters: [
        { id: 1, name: "Ostrica d'Oro", price: 24, ingredients: "Fresh Adriatic oyster, saffron-lime granita, Prosecco pearls, 24K gold leaf." },
        { id: 2, name: "Carpaccio di Branzino", price: 26, ingredients: "Wild sea bass, citrus zest, fennel pollen, pink peppercorn oil, sea salt flakes." },
        { id: 3, name: "Burrata nel Velo", price: 22, ingredients: "Creamy burrata, prosciutto di San Daniele, fig compote, aged balsamic pearls, basil." },
        { id: 4, name: "Nebbia di Bosco", price: 20, ingredients: "Savory tart of wild porcini and chanterelles, black truffle cream, thyme-scented crust." },
        { id: 5, name: "Gambero in Ombra", price: 28, ingredients: "Charcoal-seared red prawn, bergamot mist, smoked salt, olive oil caviar." },
        { id: 6, name: "Vellutata di Cavolfiore", price: 18, ingredients: "Silky cauliflower velouté, marinated white anchovy, toasted pine nuts, rosemary oil." }
    ],
    mainCourses: [
        { id: 7, name: "Il Segreto del Doge", price: 48, ingredients: "Slow-braised veal, Amarone reduction, Venetian spices, golden pastry crust, black truffle essence." },
        { id: 8, name: "Branzino alla Serenissima", price: 42, ingredients: "Oven-roasted sea bass, saffron cream, candied lemon, Taggiasca olive dust." },
        { id: 9, name: "Anatra in Laguna", price: 44, ingredients: "Crispy duck breast, cherry and Barolo glaze, grilled radicchio, fig ash." },
        { id: 10, name: "Filetto al Tartufo Bianco", price: 52, ingredients: "Beef tenderloin, white truffle butter, celery root purée, aged red wine jus." },
        { id: 11, name: "Melanzana d'Oro", price: 34, ingredients: "Layered heirloom eggplant, smoked mozzarella, San Marzano coulis, basil oil, parmesan wafer." },
        { id: 12, name: "Aragosta Veneziana", price: 58, ingredients: "Poached lobster tail, saffron risotto, citrus gremolata, coral tuile." }
    ],
    sideDishes: [
        { id: 13, name: "Patate all'Oro", price: 12, ingredients: "Crispy golden potatoes, rosemary oil, Parmigiano Reggiano dust." },
        { id: 14, name: "Verdure Grigliate", price: 14, ingredients: "Seasonal grilled vegetables, basil emulsion, Maldon sea salt." },
        { id: 15, name: "Insalata di Campo", price: 10, ingredients: "Baby greens, cherry tomatoes, radish, citrus vinaigrette." },
        { id: 16, name: "Spinaci al Burro", price: 11, ingredients: "Sautéed baby spinach, creamy butter, touch of nutmeg." },
        { id: 17, name: "Purea di Topinambur", price: 13, ingredients: "Jerusalem artichoke purée, mascarpone, white pepper." },
        { id: 18, name: "Carote Glassate", price: 12, ingredients: "Glazed baby carrots, orange zest, honey-thyme glaze." }
    ],
    desserts: [
        { id: 19, name: "Torta della Serenissima", price: 18, ingredients: "Dark chocolate torte, salted caramel, hazelnut praline, gold leaf." },
        { id: 20, name: "Tiramisu d'Oro", price: 16, ingredients: "Mascarpone cream, espresso-soaked savoiardi, cocoa dust, gold flakes." },
        { id: 21, name: "Semifreddo di Pistacchio", price: 17, ingredients: "Sicilian pistachio semifreddo, berry coulis, crushed pistachios." },
        { id: 22, name: "Crema Catalana", price: 15, ingredients: "Vanilla custard, caramelized sugar crust, cinnamon stick." },
        { id: 23, name: "Tartellette di Frutta", price: 19, ingredients: "Mixed berry tart, pastry cream, mint sugar, edible flowers." },
        { id: 24, name: "Sorbetto agli Agrumi", price: 14, ingredients: "Citrus sorbet trio, prosecco gelée, candied zest." }
    ]
};

// --- STATE ---
let cart = JSON.parse(localStorage.getItem('ombradoro_cart')) || [];

// Check if user is logged in
function isLoggedIn() {
    // Use the Auth system if available
    if (window.Auth && window.Auth.isLoggedIn) {
        return window.Auth.isLoggedIn();
    }
    
    // Fallback to localStorage check
    const user = JSON.parse(localStorage.getItem('ombradoro_user'));
    return !!user;
}

// عدل دالة processCheckout لتستخدم بيانات المستخدم الفعلية:
function processCheckout() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Get user from localStorage - استخدم نفس المفتاح اللي بيستخدمه auth.js
    const user = JSON.parse(localStorage.getItem('ombradoro_user'));
    
    if (!user) {
        showNotification('Please login to checkout', 'error');
        return;
    }
    
    console.log('Processing checkout for user:', user);
    
    let address = user.address || '';
    if (!address) {
        address = prompt('Please enter your delivery address:');
        if (!address) {
            showNotification('Delivery address is required', 'error');
            return;
        }
        // Update user address
        user.address = address;
        localStorage.setItem('ombradoro_user', JSON.stringify(user));
        
        // Also update in users list
        const users = JSON.parse(localStorage.getItem('ombradoro_users')) || [];
        const userIndex = users.findIndex(u => u.id === user.id || u.email === user.email);
        if (userIndex > -1) {
            users[userIndex].address = address;
            localStorage.setItem('ombradoro_users', JSON.stringify(users));
        }
    }
    
    const orderNumber = 'ORD-' + Date.now().toString().slice(-8);
    
    let orderItemsText = '';
    cart.forEach(item => {
        orderItemsText += `• ${item.quantity}x ${item.name} - ${(item.price * item.quantity)}€\n`;
    });
    
    const confirmed = confirm(`CONFIRM ORDER\n\n📦 Order #${orderNumber}\n👤 Customer: ${user.name}\n📍 Delivery to: ${address}\n💰 Total: ${total.toFixed(2)}€\n\n📋 Items:\n${orderItemsText}\nClick OK to place your order.`);
    
    if (confirmed) {
        // Save order with COMPLETE user info
        const order = {
            id: Date.now(), // Unique ID
            order_number: orderNumber,
            user_id: user.id,
            user_email: user.email,
            user_name: user.name,
            user_phone: user.phone,
            items: [...cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                ingredients: item.ingredients
            }))],
            total: total,
            address: address,
            date: new Date().toLocaleString(),
            timestamp: Date.now(), // For sorting
            status: 'Pending',
            created_at: new Date().toISOString(),
            status_history: [
                {
                    status: 'Pending',
                    date: new Date().toISOString(),
                    notes: 'Order placed by customer'
                }
            ]
        };
        
        console.log('Saving order:', order);
        
        // Save to localStorage - استخدم نفس المفتاح اللي auth.js بيدور عليه
        let orders = JSON.parse(localStorage.getItem('ombradoro_orders')) || [];
        orders.push(order);
        localStorage.setItem('ombradoro_orders', JSON.stringify(orders));
        
        console.log('Orders in localStorage:', orders);
        
        // Clear cart
        cart = [];
        saveCart();
        closeCartSidebar();
        
        // Show success message with order details
        alert(`✅ ORDER PLACED SUCCESSFULLY!\n\n📦 Order #: ${orderNumber}\n👤 Customer: ${user.name}\n📍 Delivery: ${address}\n💰 Total: ${total.toFixed(2)}€\n📅 Date: ${new Date().toLocaleDateString()}\n🔄 Status: Pending\n\nYou will be redirected to your account page to view your order.`);
        
        // Force refresh orders display
        if (window.Auth && window.Auth.loadUserOrders) {
            window.Auth.loadUserOrders();
        }
        
        // Redirect to account page
        setTimeout(() => {
            window.location.href = 'auth.html';
        }, 1500);
    }
}

// Show login prompt
function showLoginPrompt() {
    const confirmed = confirm("You need to login to add items to cart. Go to login page?");
    if (confirmed) {
        window.location.href = 'auth.html';
    }
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    renderMenu();
    setupCartUI();
    updateCartDisplay();
    
    // Hide cart button if not logged in
    if (!isLoggedIn()) {
        const cartButton = document.getElementById('cartButton');
        if (cartButton) {
            cartButton.style.opacity = '0.5';
            cartButton.style.cursor = 'not-allowed';
            cartButton.title = "Please login to use cart";
        }
    }
});

// --- MENU RENDERING ---
function renderMenu() {
    // Map JSON keys to HTML IDs
    const sectionMap = {
        'starters': 'starters',
        'mainCourses': 'main-courses', 
        'sideDishes': 'side-dishes',   
        'desserts': 'desserts'
    };

    for (const [dataKey, items] of Object.entries(menuData)) {
        const htmlId = sectionMap[dataKey];
        if (!htmlId) continue;

        const section = document.getElementById(htmlId);
        if (!section) continue;

        const grid = section.querySelector('.menu-items-grid');
        if (!grid) continue;

        // Create HTML for items
        grid.innerHTML = items.map(item => `
            <div class="menu-item-card">
                <h3 class="dish-name">${item.name}</h3>
                <p class="dish-ingredients">${item.ingredients}</p>
                <p class="dish-price">${item.price}€</p>
                <div class="quantity-controls">
                    <button class="add-to-cart" onclick="addToCart(${item.id})">
                        ADD TO CART
                    </button>
                </div>
            </div>
        `).join('');
    }
}

// --- CART LOGIC ---

// Helper to find an item in the menuData by ID
function findItemById(id) {
    const allItems = [
        ...menuData.starters,
        ...menuData.mainCourses,
        ...menuData.sideDishes,
        ...menuData.desserts
    ];
    return allItems.find(i => i.id === id);
}

// Exposed global function (called by onclick in HTML)
window.addToCart = function(id) {
    // Check if user is logged in
    if (!isLoggedIn()) {
        showLoginPrompt();
        return;
    }
    
    const itemData = findItemById(id);
    if (!itemData) return;

    const existingItem = cart.find(i => i.id === id);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: itemData.id,
            name: itemData.name,
            price: itemData.price,
            ingredients: itemData.ingredients,
            quantity: 1
        });
    }

    saveCart();
    showNotification(`${itemData.name} added to cart`, 'success');
    openCartSidebar();
};

window.removeFromCart = function(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
};

window.updateQuantity = function(id, change) {
    const item = cart.find(i => i.id === id);
    if (!item) return;

    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(id);
    } else {
        saveCart();
    }
};

function saveCart() {
    localStorage.setItem('ombradoro_cart', JSON.stringify(cart));
    updateCartDisplay();
}

function clearCart() {
    if(confirm('Clear all items?')) {
        cart = [];
        saveCart();
    }
}

// --- UI UPDATES ---

function updateCartDisplay() {
    const cartCount = document.getElementById('cartCount');
    const cartItemsContainer = document.getElementById('cartItems');
    const totalPriceEl = document.getElementById('totalPrice');

    // 1. Update Badge
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) cartCount.textContent = totalQty;

    // 2. Update List
    if (cartItemsContainer) {
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart-message">Your cart is empty</p>';
        } else {
            cartItemsContainer.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <div class="cart-item-header">
                        <h4 class="cart-item-name">${item.name}</h4>
                        <span class="cart-item-price">${item.price * item.quantity}€</span>
                    </div>
                    <div class="cart-item-controls">
                        <div class="cart-item-quantity">
                            <button onclick="updateQuantity(${item.id}, -1)">-</button>
                            <span>${item.quantity}</span>
                            <button onclick="updateQuantity(${item.id}, 1)">+</button>
                        </div>
                        <button class="remove-item-btn" onclick="removeFromCart(${item.id})">Remove</button>
                    </div>
                </div>
            `).join('');
        }
    }

    // 3. Update Total
    if (totalPriceEl) {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        totalPriceEl.textContent = `${total}€`;
    }
}

// --- SIDEBAR & CHECKOUT ---

function setupCartUI() {
    const cartBtn = document.getElementById('cartButton');
    const closeBtn = document.getElementById('closeCart');
    const overlay = document.getElementById('cartOverlay');
    const clearBtn = document.getElementById('clearCart');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (cartBtn) cartBtn.addEventListener('click', openCartSidebar);
    if (closeBtn) closeBtn.addEventListener('click', closeCartSidebar);
    if (overlay) overlay.addEventListener('click', closeCartSidebar);
    if (clearBtn) clearBtn.addEventListener('click', clearCart);
    
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            // Check if user is logged in
            if (!isLoggedIn()) {
                showLoginPrompt();
                return;
            }
            
            // Check if cart is empty
            if (cart.length === 0) {
                showNotification('Your cart is empty!', 'error');
                return;
            }
            
            // Proceed with checkout
            processCheckout();
        });
    }
}

function openCartSidebar() {
    // Check if user is logged in before opening cart
    if (!isLoggedIn()) {
        showLoginPrompt();
        return;
    }
    
    document.getElementById('cartSidebar').classList.add('active');
    document.getElementById('cartOverlay').classList.add('active');
}

function closeCartSidebar() {
    document.getElementById('cartSidebar').classList.remove('active');
    document.getElementById('cartOverlay').classList.remove('active');
}

function processCheckout() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const user = JSON.parse(localStorage.getItem('ombradoro_user')) || 
                 JSON.parse(localStorage.getItem('user'));
    
    if (!user) {
        showNotification('Please login to checkout', 'error');
        return;
    }
    
    // Ask for delivery address if not already set
    let address = user.address || '';
    if (!address) {
        address = prompt('Please enter your delivery address:');
        if (!address) {
            showNotification('Delivery address is required', 'error');
            return;
        }
        // Save address to user
        user.address = address;
        localStorage.setItem('ombradoro_user', JSON.stringify(user));
    }
    
    // Show order confirmation
    const orderNumber = 'ORD-' + Date.now().toString().slice(-8);
    const confirmed = confirm(`Confirm your order?\n\nOrder #${orderNumber}\nDelivery to: ${address}\nTotal: ${total}€\n\nItems:\n${cart.map(item => `- ${item.quantity}x ${item.name}`).join('\n')}`);
    
    if (confirmed) {
        // Save order to localStorage
        const order = {
            id: Date.now(),
            order_number: orderNumber,
            user_id: user.id || user.email,
            user_name: user.name || user.email,
            items: [...cart],
            total: total,
            address: address,
            date: new Date().toLocaleString(),
            status: 'Pending'
        };
        
        let orders = JSON.parse(localStorage.getItem('ombradoro_orders')) || [];
        orders.push(order);
        localStorage.setItem('ombradoro_orders', JSON.stringify(orders));
        
        // Clear cart
        cart = [];
        saveCart();
        
        // Close sidebar
        closeCartSidebar();
        
        // Show success message
        alert(`✅ Order #${orderNumber} placed successfully!\n\nTotal: ${total}€\nStatus: Pending\n\nYou can track your order in your account.`);
        
        // Redirect to account page
        setTimeout(() => {
            window.location.href = 'auth.html';
        }, 2000);
    }
}

// --- NOTIFICATION ---
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.textContent = message;
    notification.className = 'notification';
    
    if (type === 'error') {
        notification.style.backgroundColor = '#dc3545';
    } else if (type === 'success') {
        notification.style.backgroundColor = '#28a745';
    } else {
        notification.style.backgroundColor = '#b8860b';
    }
    
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}