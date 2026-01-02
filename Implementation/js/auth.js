// js/auth.js
class AuthSystem {
    constructor() {
        this.user = null;
        this.token = null;
        this.init();
    }
    
    init() {
        // Load saved user from localStorage
        const savedUser = localStorage.getItem('ombradoro_user');
        const savedToken = localStorage.getItem('ombradoro_token');
        
        if (savedUser && savedToken) {
            this.user = JSON.parse(savedUser);
            this.token = savedToken;
        }
        
        this.setupEventListeners();
        this.updateUI();
        this.initializeDemoUsers(); // Add demo users
    }
    
    initializeDemoUsers() {
        // Check if demo users already exist
        let users = JSON.parse(localStorage.getItem('ombradoro_users')) || [];
        
        // Add demo users if they don't exist
        const demoUsers = [
            {
                id: 1,
                name: "Ahmed Test",
                email: "ahmed@test.com",
                phone: "0101111111",
                password: "ahmed123",
                address: "123 Test Street, Cairo"
            },
            {
                id: 2,
                name: "Sara Test",
                email: "sara@test.com", 
                phone: "0102222222",
                password: "sara123",
                address: "456 Test Avenue, Alexandria"
            },
            {
                id: 3,
                name: "Omar Test",
                email: "omar@test.com",
                phone: "0103333333",
                password: "omar123",
                address: "789 Test Road, Giza"
            },
            {
                id: 4, 
                name: "John Doe",
                email: "john@example.com",
                phone: "+39 123 456 7890",
                password: "password123",
                address: "123 Main Street, Venice, 30124"
            }
        ];
        
        let usersUpdated = false;
        demoUsers.forEach(demoUser => {
            const exists = users.some(u => u.email === demoUser.email);
            if (!exists) {
                users.push(demoUser);
                usersUpdated = true;
            }
        });
        
        if (usersUpdated) {
            localStorage.setItem('ombradoro_users', JSON.stringify(users));
            console.log('Demo users initialized');
        }
    }
    
    setupEventListeners() {
        // Sign in form
        const signinForm = document.getElementById('signinForm');
        if (signinForm) {
            signinForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.signIn();
            });
        }
        
        // Sign up form
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.signUp();
            });
        }
        
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
        
        // Switch between forms
        document.getElementById('switchToSignup')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showSignup();
        });
        
        document.getElementById('switchToSignin')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showSignin();
        });
        
        // Edit profile button
        document.getElementById('editProfileBtn')?.addEventListener('click', () => {
            this.showEditModal();
        });
        
        // Close edit modal
        document.getElementById('closeModal')?.addEventListener('click', () => {
            this.closeEditModal();
        });
        
        document.getElementById('cancelEdit')?.addEventListener('click', () => {
            this.closeEditModal();
        });
        
        // Save edit profile
        const editProfileForm = document.getElementById('editProfileForm');
        if (editProfileForm) {
            editProfileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProfile();
            });
        }
        
        // Delete account
        document.getElementById('deleteAccountBtn')?.addEventListener('click', () => {
            this.deleteAccount();
        });
    }
    
    async signIn() {
        const email = document.getElementById('signinEmail').value.trim();
        const password = document.getElementById('signinPassword').value;
        
        console.log('Attempting login with:', { email, password });
        
        if (!email || !password) {
            this.showNotification('Please fill all fields', 'error');
            return;
        }
        
        try {
            // FIRST: Try localStorage (demo users)
            const users = JSON.parse(localStorage.getItem('ombradoro_users')) || [];
            console.log('LocalStorage users:', users);
            
            const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
            console.log('Found user:', user);
            
            if (user) {
                console.log('Comparing passwords:', { input: password, stored: user.password });
                if (user.password === password) {
                    // Login successful
                    this.user = {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        phone: user.phone || '',
                        address: user.address || ''
                    };
                    this.token = 'token_' + Date.now();
                    
                    // Save session
                    localStorage.setItem('ombradoro_user', JSON.stringify(this.user));
                    localStorage.setItem('ombradoro_token', this.token);
                    
                    // Clear password field
                    document.getElementById('signinPassword').value = '';
                    
                    this.updateUI();
                    this.showNotification('Login successful! Welcome ' + user.name, 'success');
                    
                    // Redirect to home
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                    return;
                } else {
                    this.showNotification('Incorrect password for ' + email, 'error');
                    return;
                }
            }
            
            // SECOND: Try API if available
            try {
                const API_BASE = 'http://localhost:5000/api';
                const response = await fetch(`${API_BASE}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                console.log('API response:', data);
                
                if (data.success) {
                    // API login successful
                    this.user = data.user;
                    this.token = data.token;
                    
                    localStorage.setItem('ombradoro_user', JSON.stringify(this.user));
                    localStorage.setItem('ombradoro_token', this.token);
                    
                    // Clear password field
                    document.getElementById('signinPassword').value = '';
                    
                    this.updateUI();
                    this.showNotification('Login successful! Welcome ' + data.user.name, 'success');
                    
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                    return;
                } else {
                    this.showNotification(data.message || 'Login failed', 'error');
                }
            } catch (apiError) {
                console.log('API not available, using localStorage only');
            }
            
            // If we get here, no user found
            const confirmCreate = confirm(`No account found for ${email}. Create a new account?`);
            if (confirmCreate) {
                // Auto-fill signup form
                document.getElementById('signupEmail').value = email;
                this.showSignup();
            }
            
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification('Login failed. Please try again.', 'error');
        }
    }
    
    async signUp() {
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const address = document.getElementById('address').value.trim();
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validation
        if (!firstName || !lastName || !email || !phone || !password) {
            this.showNotification('Please fill all required fields', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showNotification('Passwords do not match', 'error');
            return;
        }
        
        if (password.length < 8) {
            this.showNotification('Password must be at least 8 characters', 'error');
            return;
        }
        
        if (!this.validateEmail(email)) {
            this.showNotification('Please enter a valid email address', 'error');
            return;
        }
        
        try {
            // Check if email already exists in localStorage
            let users = JSON.parse(localStorage.getItem('ombradoro_users')) || [];
            const emailExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
            
            if (emailExists) {
                this.showNotification('Email already registered. Please sign in.', 'error');
                this.showSignin();
                return;
            }
            
            // Create new user
            const newUser = {
                id: Date.now(),
                name: `${firstName} ${lastName}`,
                email: email,
                phone: phone,
                address: address || '',
                password: password, // In real app, you should hash this!
                created_at: new Date().toISOString()
            };
            
            // Save to localStorage
            users.push(newUser);
            localStorage.setItem('ombradoro_users', JSON.stringify(users));
            
            // Set current user session (without password)
            this.user = {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                address: newUser.address
            };
            this.token = 'token_' + Date.now();
            
            localStorage.setItem('ombradoro_user', JSON.stringify(this.user));
            localStorage.setItem('ombradoro_token', this.token);
            
            // Clear form
            document.getElementById('signupForm').reset();
            
            this.updateUI();
            this.showNotification('Account created successfully! Welcome ' + newUser.name, 'success');
            
            // Redirect to home
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
            
        } catch (error) {
            console.error('Signup error:', error);
            this.showNotification('Registration failed. Please try again.', 'error');
        }
    }
    
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    logout() {
        // Clear session
        localStorage.removeItem('ombradoro_user');
        localStorage.removeItem('ombradoro_token');
        
        // Clear cart
        localStorage.removeItem('ombradoro_cart');
        
        this.user = null;
        this.token = null;
        
        this.updateUI();
        this.showNotification('Logged out successfully', 'success');
        
        // Redirect to home
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
    }
    
    updateUI() {
        const isLoggedIn = !!this.user;
        
        // Update auth page
        if (document.getElementById('signinContainer')) {
            if (isLoggedIn) {
                // Show profile
                document.getElementById('signinContainer').classList.remove('active');
                document.getElementById('signupContainer').classList.remove('active');
                document.getElementById('profileContainer').classList.add('active');
                
                // Update profile info with ACTUAL user data
                document.getElementById('profileName').textContent = this.user.name;
                document.getElementById('profileEmail').textContent = this.user.email;
                
                // Get initials from actual name
                const initials = this.user.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .substring(0, 2);
                document.getElementById('profileInitials').textContent = initials;
                
                document.getElementById('detailFullName').textContent = this.user.name;
                document.getElementById('detailEmail').textContent = this.user.email;
                document.getElementById('detailPhone').textContent = this.user.phone || 'Not provided';
                
                // Format member since date
                const users = JSON.parse(localStorage.getItem('ombradoro_users')) || [];
                const userData = users.find(u => u.id === this.user.id || u.email === this.user.email);
                const createdDate = userData?.created_at ? new Date(userData.created_at) : new Date();
                document.getElementById('detailMemberSince').textContent = 
                    createdDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                
                document.getElementById('addressText').textContent = this.user.address || 'No address provided';
                
                // Load user's orders
                this.loadUserOrders();
                
            } else {
                // Show sign in
                document.getElementById('profileContainer').classList.remove('active');
                document.getElementById('signupContainer').classList.remove('active');
                document.getElementById('signinContainer').classList.add('active');
            }
        }
        
        // Update header on all pages
        this.updateHeaderButton();
    }
    
    updateHeaderButton() {
        const authButton = document.getElementById('authButton');
        if (authButton) {
            if (this.user) {
                // Show user's first name or "ACCOUNT"
                const firstName = this.user.name.split(' ')[0];
                authButton.textContent = firstName || "ACCOUNT";
                authButton.onclick = () => {
                    window.location.href = 'auth.html';
                };
                
                // Update style
                authButton.style.background = '#d8b84d';
                authButton.style.color = '#060c0e';
                authButton.style.border = '2px solid #d8b84d';
            } else {
                authButton.textContent = "SIGN IN";
                authButton.onclick = () => {
                    window.location.href = 'auth.html';
                };
                
                // Reset style
                authButton.style.background = 'transparent';
                authButton.style.color = '#d8b84d';
                authButton.style.border = '2px solid #d8b84d';
            }
        }
    }
    
    // في auth.js - في دالة loadUserOrders
    loadUserOrders() {
        const orderHistory = document.getElementById('orderHistory');
        if (!orderHistory) return;
        
        console.log('Loading orders for user:', this.user);
        
        // Get ALL orders from localStorage
        const allOrders = JSON.parse(localStorage.getItem('ombradoro_orders')) || [];
        console.log('All orders found:', allOrders);
        
        // Filter for current user
        const userOrders = allOrders.filter(order => {
            if (!order) return false;
            
            // Match by exact user_id
            if (order.user_id && this.user.id && order.user_id === this.user.id) {
                return true;
            }
            
            // Match by email
            if (order.user_email && this.user.email && 
                order.user_email.toLowerCase() === this.user.email.toLowerCase()) {
                return true;
            }
            
            // Match by name
            if (order.user_name && this.user.name && 
                order.user_name.toLowerCase() === this.user.name.toLowerCase()) {
                return true;
            }
            
            return false;
        }).sort((a, b) => {
            // Sort by timestamp or date, newest first
            const timeA = a.timestamp || new Date(a.date || a.created_at || a.id).getTime();
            const timeB = b.timestamp || new Date(b.date || b.created_at || b.id).getTime();
            return timeB - timeA;
        });
        
        console.log('Filtered user orders:', userOrders);
        
        if (userOrders.length === 0) {
            orderHistory.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #ccc;">
                    <p style="margin-bottom: 20px; font-size: 18px; color: #d8b84d;">No orders yet</p>
                    <p style="margin-bottom: 30px;">Start your culinary journey with Ombra d'Oro</p>
                    <a href="./order.html" style="
                        display: inline-block;
                        background: #d8b84d;
                        color: #060c0e;
                        padding: 12px 30px;
                        border-radius: 5px;
                        text-decoration: none;
                        font-weight: bold;
                        font-family: 'Raleway', sans-serif;
                        transition: all 0.3s;
                    " onmouseover="this.style.background='#fbde7c'" 
                    onmouseout="this.style.background='#d8b84d'">
                    </a>
                </div>
            `;
            return;
        }
        
        let html = `<div class="orders-header" style="margin-bottom: 30px;">
                        <h2 style="color: #d8b84d; margin-bottom: 10px;">Your Orders</h2>
                        <p style="color: #ccc;">${userOrders.length} order${userOrders.length > 1 ? 's' : ''} placed</p>
                    </div>`;
        
        html += '<div class="orders-list">';
        
        userOrders.forEach((order, index) => {
            const orderDate = order.date ? 
                new Date(order.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }) : 
                new Date(order.timestamp || order.id).toLocaleDateString();
            
            const total = order.total || (order.items?.reduce((sum, item) => 
                sum + (item.price * item.quantity), 0) || 0);
            
            // Status
            const status = order.status || 'Pending';
            const statusClass = status.toLowerCase();
            
            // Status color based on status
            let statusColor, statusBg;
            switch(statusClass) {
                case 'delivered':
                    statusColor = '#0c5460';
                    statusBg = '#d1ecf1';
                    break;
                case 'ready':
                    statusColor = '#155724';
                    statusBg = '#d4edda';
                    break;
                case 'preparing':
                    statusColor = '#004085';
                    statusBg = '#cce5ff';
                    break;
                case 'cancelled':
                    statusColor = '#721c24';
                    statusBg = '#f8d7da';
                    break;
                default: // pending
                    statusColor = '#856404';
                    statusBg = '#fff3cd';
            }
            
            html += `
                <div class="order-card" style="
                    background: #0b1214;
                    border: 1px solid #2a3a40;
                    border-radius: 10px;
                    padding: 25px;
                    margin-bottom: 25px;
                    transition: all 0.3s;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                " onmouseover="this.style.borderColor='#d8b84d'; this.style.transform='translateY(-3px)';" 
                onmouseout="this.style.borderColor='#2a3a40'; this.style.transform='translateY(0)';">
                    
                    <!-- Order Header -->
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                        <div>
                            <div style="color: #d8b84d; font-size: 20px; font-weight: bold; margin-bottom: 5px;">
                                ${order.order_number || 'Order #' + (order.id || '').toString().slice(-6)}
                            </div>
                            <div style="color: #ccc; font-size: 14px;">
                                ${orderDate}
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <span style="
                                display: inline-block;
                                padding: 6px 15px;
                                border-radius: 20px;
                                font-size: 12px;
                                font-weight: bold;
                                background: ${statusBg};
                                color: ${statusColor};
                                margin-bottom: 10px;
                            ">
                                ${status}
                            </span>
                            <div style="color: #d8b84d; font-size: 22px; font-weight: bold;">
                                ${total.toFixed(2)}€
                            </div>
                        </div>
                    </div>
                    
                    <!-- Delivery Info -->
                    <div style="
                        background: #060c0e;
                        border-radius: 5px;
                        padding: 15px;
                        margin-bottom: 20px;
                        border-left: 3px solid #d8b84d;
                    ">
                        <div style="color: #d8b84d; font-weight: bold; margin-bottom: 5px;">
                             Delivery Information
                        </div>
                        <div style="color: #ccc; font-size: 14px;">
                            ${order.address || 'Not specified'}
                        </div>
                    </div>
                    
                    <!-- Order Items - SHOW ALL ITEMS -->
                    <div style="margin-bottom: 25px;">
                        <div style="color: #d8b84d; font-weight: bold; margin-bottom: 15px; font-size: 16px;">
                             Ordered Items
                        </div>
                        
                        <div style="
                            background: #060c0e;
                            border-radius: 5px;
                            overflow: hidden;
                        ">
                            <!-- Header -->
                            <div style="
                                display: grid;
                                grid-template-columns: 2fr 1fr 1fr 1fr;
                                background: #011922;
                                padding: 12px 15px;
                                font-weight: bold;
                                color: #d8b84d;
                                font-size: 14px;
                            ">
                                <div>Item</div>
                                <div style="text-align: center;">Price</div>
                                <div style="text-align: center;">Qty</div>
                                <div style="text-align: right;">Subtotal</div>
                            </div>
                            
                            <!-- Items List -->
                            ${order.items?.map((item, idx) => `
                                <div style="
                                    display: grid;
                                    grid-template-columns: 2fr 1fr 1fr 1fr;
                                    padding: 12px 15px;
                                    border-bottom: ${idx < order.items.length - 1 ? '1px solid #2a3a40' : 'none'};
                                    align-items: center;
                                    transition: background 0.3s;
                                " onmouseover="this.style.background='rgba(216, 184, 77, 0.05)'" 
                                onmouseout="this.style.background='transparent'">
                                    <div style="color: #fff; font-weight: 500;">
                                        ${item.name}
                                        ${item.ingredients ? `<div style="color: #888; font-size: 12px; margin-top: 3px;">${item.ingredients.substring(0, 50)}${item.ingredients.length > 50 ? '...' : ''}</div>` : ''}
                                    </div>
                                    <div style="text-align: center; color: #d8b84d;">${item.price}€</div>
                                    <div style="text-align: center; color: #ccc;">${item.quantity}</div>
                                    <div style="text-align: right; color: #d8b84d; font-weight: bold;">
                                        ${(item.price * item.quantity).toFixed(2)}€
                                    </div>
                                </div>
                            `).join('')}
                            
                            <!-- Total -->
                            <div style="
                                display: grid;
                                grid-template-columns: 2fr 1fr 1fr 1fr;
                                padding: 15px;
                                background: #011922;
                                font-weight: bold;
                                font-size: 16px;
                            ">
                                <div style="text-align: right; grid-column: 1 / 4; color: #ccc;">Total Amount:</div>
                                <div style="text-align: right; color: #d8b84d;">${total.toFixed(2)}€</div>
                            </div>
                        </div>
                    </div>
                    
                    
                    <!-- Cancel Button (only for Pending/Preparing) -->
                    ${status === 'Pending' || status === 'Preparing' ? `
                        <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #2a3a40;">
                            <button onclick="window.Auth.cancelOrder(${order.id})" style="
                                background: #dc3545;
                                color: white;
                                border: none;
                                padding: 10px 25px;
                                border-radius: 5px;
                                cursor: pointer;
                                font-family: 'Raleway', sans-serif;
                                font-weight: bold;
                                font-size: 14px;
                                transition: all 0.3s;
                            " onmouseover="this.style.background='#e74c3c'; this.style.transform='scale(1.05)'" 
                            onmouseout="this.style.background='#dc3545'; this.style.transform='scale(1)'">
                                Cancel Order
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        html += '</div>'; // Close orders-list
        
        orderHistory.innerHTML = html;
    }
   showSignup() {
        document.getElementById('signinContainer').classList.remove('active');
        document.getElementById('signupContainer').classList.add('active');
    }
    
    showSignin() {
        document.getElementById('signupContainer').classList.remove('active');
        document.getElementById('signinContainer').classList.add('active');
    }
    
    showEditModal() {
        if (!this.user) return;
        
        // Fill form with current user data
        const names = this.user.name.split(' ');
        document.getElementById('editFirstName').value = names[0] || '';
        document.getElementById('editLastName').value = names.slice(1).join(' ') || '';
        document.getElementById('editPhone').value = this.user.phone || '';
        document.getElementById('editAddress').value = this.user.address || '';
        
        // Show modal
        document.getElementById('editModal').style.display = 'flex';
    }
    
    closeEditModal() {
        document.getElementById('editModal').style.display = 'none';
    }
    
    saveProfile() {
        const firstName = document.getElementById('editFirstName').value.trim();
        const lastName = document.getElementById('editLastName').value.trim();
        const phone = document.getElementById('editPhone').value.trim();
        const address = document.getElementById('editAddress').value.trim();
        
        if (!firstName || !lastName || !phone) {
            this.showNotification('Please fill all required fields', 'error');
            return;
        }
        
        // Update current user
        this.user.name = `${firstName} ${lastName}`;
        this.user.phone = phone;
        this.user.address = address;
        
        // Update localStorage
        localStorage.setItem('ombradoro_user', JSON.stringify(this.user));
        
        // Update users list
        const users = JSON.parse(localStorage.getItem('ombradoro_users')) || [];
        const userIndex = users.findIndex(u => 
            u.id === this.user.id || u.email === this.user.email
        );
        
        if (userIndex > -1) {
            users[userIndex].name = this.user.name;
            users[userIndex].phone = this.user.phone;
            users[userIndex].address = this.user.address;
            localStorage.setItem('ombradoro_users', JSON.stringify(users));
        }
        
        this.closeEditModal();
        this.updateUI();
        this.showNotification('Profile updated successfully', 'success');
    }
    
    deleteAccount() {
        if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            return;
        }
        
        if (!this.user) return;
        
        try {
            // Remove from users list
            let users = JSON.parse(localStorage.getItem('ombradoro_users')) || [];
            users = users.filter(u => 
                u.id !== this.user.id && u.email !== this.user.email
            );
            localStorage.setItem('ombradoro_users', JSON.stringify(users));
            
            // Clear user data
            localStorage.removeItem('ombradoro_user');
            localStorage.removeItem('ombradoro_token');
            localStorage.removeItem('ombradoro_cart');
            
            this.user = null;
            this.token = null;
            
            this.showNotification('Account deleted successfully', 'success');
            
            // Redirect to home
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
            
        } catch (error) {
            console.error('Delete account error:', error);
            this.showNotification('Failed to delete account', 'error');
        }
    }
    
    isLoggedIn() {
        return !!this.user;
    }
    
    getUser() {
        return this.user;
    }
    
    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        if (!notification) {
            // Create notification element if it doesn't exist
            const div = document.createElement('div');
            div.id = 'notification';
            div.style.cssText = `
                position: fixed;
                top: 120px;
                right: 30px;
                background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#b8860b'};
                color: white;
                padding: 15px 25px;
                border-radius: 5px;
                z-index: 1000;
                opacity: 0;
                transform: translateX(100px);
                transition: all 0.3s ease-in-out;
                font-family: 'Raleway', sans-serif;
                font-weight: bold;
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            `;
            document.body.appendChild(div);
            return this.showNotification(message, type); // Retry
        }
        
        // Update notification
        notification.textContent = message;
        notification.style.background = type === 'error' ? '#dc3545' : 
                                      type === 'success' ? '#28a745' : '#b8860b';
        
        // Show notification
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
        
        // Hide after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100px)';
        }, 3000);
    }
    // في AuthSystem class أضف:
    viewOrderDetails(orderId) {
        const allOrders = JSON.parse(localStorage.getItem('ombradoro_orders')) || [];
        const order = allOrders.find(o => o.id === orderId);
        
        if (!order) {
            this.showNotification('Order not found', 'error');
            return;
        }
        
        const total = order.total || (order.items?.reduce((sum, item) => 
            sum + (item.price * item.quantity), 0) || 0);
        
        // Create modal
        const modalHTML = `
            <div class="order-details-modal" style="
                position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                background: rgba(0,0,0,0.8); display: flex; align-items: center; 
                justify-content: center; z-index: 9999; padding: 20px;
            ">
                <div style="
                    background: #0b1214; border: 2px solid #d8b84d; border-radius: 10px;
                    width: 100%; max-width: 800px; max-height: 90vh; overflow-y: auto;
                    padding: 30px; position: relative;
                ">
                    <button onclick="this.closest('.order-details-modal').remove()" style="
                        position: absolute; top: 15px; right: 15px; background: none;
                        border: none; color: #d8b84d; font-size: 24px; cursor: pointer;
                    ">&times;</button>
                    
                    <h2 style="color: #d8b84d; margin-bottom: 20px;">
                        Order Details - ${order.order_number || 'Order #' + order.id}
                    </h2>
                    
                    <!-- Order Info -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                        <div>
                            <h3 style="color: #d8b84d; margin-bottom: 10px;">Order Information</h3>
                            <p><strong>Order Number:</strong> ${order.order_number || 'N/A'}</p>
                            <p><strong>Order Date:</strong> ${new Date(order.date || order.id).toLocaleString()}</p>
                            <p><strong>Status:</strong> <span class="status-badge ${order.status?.toLowerCase()}">${order.status || 'Pending'}</span></p>
                            <p><strong>Total Amount:</strong> ${total.toFixed(2)}€</p>
                        </div>
                        <div>
                            <h3 style="color: #d8b84d; margin-bottom: 10px;">Delivery Information</h3>
                            <p><strong>Customer:</strong> ${order.user_name || this.user.name}</p>
                            <p><strong>Address:</strong> ${order.address || 'Not specified'}</p>
                            <p><strong>Phone:</strong> ${this.user.phone || 'Not provided'}</p>
                        </div>
                    </div>
                    
                    <!-- Status Timeline -->
                    <div style="margin-bottom: 30px; background: #060c0e; padding: 20px; border-radius: 5px;">
                        <h3 style="color: #d8b84d; margin-bottom: 15px;">Order Progress</h3>
                        <div style="display: flex; justify-content: space-between; position: relative;">
                            ${['Pending', 'Preparing', 'Ready', 'Delivered'].map((status, idx) => {
                                const currentStatus = order.status?.toLowerCase() || 'pending';
                                const statusIndex = ['pending', 'preparing', 'ready', 'delivered'].indexOf(currentStatus);
                                const isActive = idx <= statusIndex;
                                const isCompleted = idx < statusIndex;
                                
                                return `
                                    <div style="text-align: center; z-index: 1; position: relative;">
                                        <div style="
                                            width: 40px; height: 40px; border-radius: 50%;
                                            background: ${isActive ? '#d8b84d' : '#2a3a40'};
                                            color: ${isActive ? '#060c0e' : '#ccc'};
                                            display: flex; align-items: center; justify-content: center;
                                            margin: 0 auto 10px; font-weight: bold;
                                            border: 2px solid ${isActive ? '#fbde7c' : '#2a3a40'};
                                        ">
                                            ${isCompleted ? '✓' : idx + 1}
                                        </div>
                                        <div style="color: ${isActive ? '#d8b84d' : '#ccc'}; font-size: 14px;">
                                            ${status}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                            <div style="
                                position: absolute; top: 20px; left: 50px; right: 50px;
                                height: 3px; background: #2a3a40; z-index: 0;
                            "></div>
                            <div style="
                                position: absolute; top: 20px; left: 50px; width: ${(statusIndex / 3) * 100}%;
                                height: 3px; background: #d8b84d; z-index: 0; transition: width 0.5s;
                            "></div>
                        </div>
                    </div>
                    
                    <!-- Order Items -->
                    <div style="margin-bottom: 30px;">
                        <h3 style="color: #d8b84d; margin-bottom: 15px;">Order Items</h3>
                        <div style="background: #060c0e; border-radius: 5px; overflow: hidden;">
                            <div style="display: grid; grid-template-columns: 3fr 1fr 1fr 1fr; 
                                    background: #011922; padding: 15px; font-weight: bold; color: #d8b84d;">
                                <div>Item</div>
                                <div>Price</div>
                                <div>Quantity</div>
                                <div>Subtotal</div>
                            </div>
                            ${order.items?.map(item => `
                                <div style="
                                    display: grid; grid-template-columns: 3fr 1fr 1fr 1fr;
                                    padding: 15px; border-bottom: 1px solid #2a3a40;
                                    align-items: center;
                                ">
                                    <div>${item.name}</div>
                                    <div>${item.price}€</div>
                                    <div>${item.quantity}</div>
                                    <div>${(item.price * item.quantity).toFixed(2)}€</div>
                                </div>
                            `).join('')}
                            <div style="
                                display: grid; grid-template-columns: 3fr 1fr 1fr 1fr;
                                padding: 15px; background: #011922; font-weight: bold;
                            ">
                                <div style="text-align: right; grid-column: 1 / 4;">Total:</div>
                                <div style="color: #d8b84d;">${total.toFixed(2)}€</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Status History -->
                    <div>
                        <h3 style="color: #d8b84d; margin-bottom: 15px;">Status History</h3>
                        <div style="background: #060c0e; border-radius: 5px; padding: 20px;">
                            ${(order.status_history || [{status: order.status || 'Pending', date: order.date || new Date().toISOString()}])
                                .map((record, idx) => `
                                <div style="
                                    display: flex; justify-content: space-between;
                                    padding: 10px 0; border-bottom: ${idx < (order.status_history?.length || 1) - 1 ? '1px solid #2a3a40' : 'none'};
                                ">
                                    <div>
                                        <strong style="color: #d8b84d;">${record.status || order.status}</strong>
                                        <div style="color: #ccc; font-size: 14px; margin-top: 5px;">
                                            ${record.notes || (idx === 0 ? 'Order placed by customer' : 'Status updated')}
                                        </div>
                                    </div>
                                    <div style="color: #ccc; font-size: 14px;">
                                        ${new Date(record.date || order.date).toLocaleDateString()}<br>
                                        ${new Date(record.date || order.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- Actions -->
                    ${(order.status === 'Pending' || order.status === 'Preparing') ? `
                        <div style="margin-top: 30px; text-align: center;">
                            <button onclick="auth.cancelOrder(${order.id})" style="
                                background: #dc3545; color: white; border: none; padding: 12px 30px;
                                border-radius: 5px; cursor: pointer; font-weight: bold;
                                font-family: 'Raleway', sans-serif;
                            ">
                                Cancel This Order
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    cancelOrder(orderId) {
        if (!confirm('Are you sure you want to cancel this order?')) return;
        
        const allOrders = JSON.parse(localStorage.getItem('ombradoro_orders')) || [];
        const orderIndex = allOrders.findIndex(o => o.id === orderId);
        
        if (orderIndex === -1) {
            this.showNotification('Order not found', 'error');
            return;
        }
        
        const order = allOrders[orderIndex];
        
        // Check if order can be cancelled
        if (order.status === 'Delivered' || order.status === 'Cancelled') {
            this.showNotification(`Order cannot be cancelled (Status: ${order.status})`, 'error');
            return;
        }
        
        // Update order status
        order.status = 'Cancelled';
        
        // Add to status history
        if (!order.status_history) order.status_history = [];
        order.status_history.push({
            status: 'Cancelled',
            date: new Date().toISOString(),
            notes: 'Cancelled by customer'
        });
        
        // Update in localStorage
        allOrders[orderIndex] = order;
        localStorage.setItem('ombradoro_orders', JSON.stringify(allOrders));
        
        this.showNotification('Order cancelled successfully', 'success');
        this.loadUserOrders(); // Refresh orders display
        
        // Close modal if open
        const modal = document.querySelector('.order-details-modal');
        if (modal) modal.remove();
    }
}
    // في order.js - عدل دالة processCheckout لتضيف status history
    function processCheckout() {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const user = JSON.parse(localStorage.getItem('ombradoro_user'));
        
        if (!user) {
            showNotification('Please login to checkout', 'error');
            return;
        }
        
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
        }
        
        const orderNumber = 'ORD-' + Date.now().toString().slice(-8);
        
        let orderItemsText = '';
        cart.forEach(item => {
            orderItemsText += `• ${item.quantity}x ${item.name} - ${(item.price * item.quantity)}€\n`;
        });
        
        const confirmed = confirm(`CONFIRM ORDER\n\n Order #${orderNumber}\n👤 Customer: ${user.name}\n Delivery to: ${address}\n💰 Total: ${total}€\n\n📋 Items:\n${orderItemsText}\nClick OK to place your order.`);
        
        if (confirmed) {
            // Save order with status history
            const order = {
                id: Date.now(),
                order_number: orderNumber,
                user_id: user.id,
                user_email: user.email,
                user_name: user.name,
                items: [...cart],
                total: total,
                address: address,
                date: new Date().toLocaleString(),
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
            
            let orders = JSON.parse(localStorage.getItem('ombradoro_orders')) || [];
            orders.push(order);
            localStorage.setItem('ombradoro_orders', JSON.stringify(orders));
            
            // Clear cart
            cart = [];
            saveCart();
            closeCartSidebar();
            
            // Simulate automatic status updates (for demo)
            simulateOrderProgress(order.id);
            
            alert(`ORDER PLACED SUCCESSFULLY!\n\n Order #: ${orderNumber}\n👤 Customer: ${user.name}\n Delivery: ${address}\n💰 Total: ${total}€\n\nYour order will be prepared soon. You can track it in your account.`);
            
            setTimeout(() => {
                window.location.href = 'auth.html';
            }, 2000);
        }
    }

    // Simulate order status changes (for demo)
    function simulateOrderProgress(orderId) {
        const allOrders = JSON.parse(localStorage.getItem('ombradoro_orders')) || [];
        const orderIndex = allOrders.findIndex(o => o.id === orderId);
        
        if (orderIndex === -1) return;
        
        const updateStatus = (status, delay, notes = '') => {
            setTimeout(() => {
                const orders = JSON.parse(localStorage.getItem('ombradoro_orders')) || [];
                const idx = orders.findIndex(o => o.id === orderId);
                if (idx === -1) return;
                
                orders[idx].status = status;
                
                if (!orders[idx].status_history) orders[idx].status_history = [];
                orders[idx].status_history.push({
                    status: status,
                    date: new Date().toISOString(),
                    notes: notes || `Status updated to ${status}`
                });
                
                localStorage.setItem('ombradoro_orders', JSON.stringify(orders));
                
                // Notify user if on the page
                if (window.Auth && window.Auth.getUser() && 
                    orders[idx].user_email === window.Auth.getUser().email) {
                    const notification = new Event('orderUpdated');
                    window.dispatchEvent(notification);
                }
                
            }, delay);
        };
        
        // Simulate status progression
        updateStatus('Preparing', 10000, 'Chef started preparing your order');
        updateStatus('Ready', 30000, 'Your order is ready for delivery');
        updateStatus('Delivered', 60000, 'Order delivered successfully');
    }


// Initialize auth system
const auth = new AuthSystem();
window.Auth = auth;

// Expose for order.js
window.isLoggedIn = () => auth.isLoggedIn();
window.getCurrentUser = () => auth.getUser();

