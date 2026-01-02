// staff.js
class StaffDashboard {
    constructor() {
        this.currentStaff = null;
        this.init();
    }
    
    init() {
        this.checkLoginStatus();
        this.setupEventListeners();
        this.updateTime();
        setInterval(() => this.updateTime(), 60000); // Update time every minute
    }
    
    checkLoginStatus() {
        // Check if staff is logged in
        const staff = JSON.parse(localStorage.getItem('ombradoro_staff'));
        
        if (staff) {
            this.currentStaff = staff;
            this.showDashboard();
        } else {
            this.showLogin();
        }
    }
    
    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('staffLoginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.login();
            });
        }
        
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
        
        // Navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.showSection(section);
            });
        });
        
        // Refresh orders
        const refreshBtn = document.getElementById('refreshOrders');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadOrders());
        }
        
        // Status filter
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.loadOrders());
        }
        
        // Add menu item button
        const addMenuItemBtn = document.getElementById('addMenuItem');
        if (addMenuItemBtn) {
            addMenuItemBtn.addEventListener('click', () => this.showAddMenuItemModal());
        }
    }
    
    login() {
        const username = document.getElementById('staffUsername').value.trim();
        const password = document.getElementById('staffPassword').value;
        const errorElement = document.getElementById('loginError');
        
        if (!username || !password) {
            this.showError('Please enter username and password');
            return;
        }
        
        // Hardcoded staff credentials (يمكن تطويرها لاستخدام قاعدة بيانات)
        const staffCredentials = {
            'admin': { password: 'admin123', name: 'Hend Ahmed', role: 'Manager' },
            'chef': { password: 'chef123', name: 'Nada Khalil', role: 'Kitchen' },
            'cashier': { password: 'cash123', name: 'Hala Mohammed', role: 'Cashier' }
        };
        
        if (staffCredentials[username] && staffCredentials[username].password === password) {
            // Login successful
            this.currentStaff = {
                username: username,
                name: staffCredentials[username].name,
                role: staffCredentials[username].role
            };
            
            // Save to localStorage
            localStorage.setItem('ombradoro_staff', JSON.stringify(this.currentStaff));
            
            // Clear password field
            document.getElementById('staffPassword').value = '';
            
            // Show dashboard
            this.showDashboard();
            
            this.showNotification(`Welcome, ${this.currentStaff.name}!`);
            
        } else {
            this.showError('Invalid username or password');
        }
    }
    
    logout() {
        localStorage.removeItem('ombradoro_staff');
        this.currentStaff = null;
        this.showLogin();
        this.showNotification('Logged out successfully');
    }
    
    showLogin() {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('dashboard').style.display = 'none';
    }
    
    showDashboard() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        
        // Update staff info
        document.getElementById('staffInfo').textContent = 
            `${this.currentStaff.name} • ${this.currentStaff.role}`;
        
        // Load initial data
        this.loadOrders();
        this.updateQuickStats();
    }
    
    showSection(sectionId) {
        // Update active nav button
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
        
        // Show selected section
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${sectionId}Section`).classList.add('active');
        
        // Load section data
        switch(sectionId) {
            case 'orders':
                this.loadOrders();
                break;
            case 'menu':
                this.loadMenuItems();
                break;
            case 'customers':
                this.loadCustomers();
                break;
            case 'stats':
                this.loadStatistics();
                break;
        }
    }
    
    updateTime() {
        const timeElement = document.getElementById('currentTime');
        if (timeElement) {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            });
            const dateString = now.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });
            timeElement.textContent = `${dateString} • ${timeString}`;
        }
    }
    
    async loadOrders() {
        const ordersTable = document.getElementById('ordersTable');
        if (!ordersTable) return;
        
        // Get all orders
        const allOrders = JSON.parse(localStorage.getItem('ombradoro_orders')) || [];
        
        // Apply filter
        const filter = document.getElementById('statusFilter')?.value || 'all';
        let filteredOrders = allOrders;
        
        if (filter !== 'all') {
            filteredOrders = allOrders.filter(order => 
                order.status?.toLowerCase() === filter.toLowerCase()
            );
        }
        
        // Sort by date (newest first)
        filteredOrders.sort((a, b) => {
            const dateA = new Date(a.timestamp || a.date || a.id);
            const dateB = new Date(b.timestamp || b.date || b.id);
            return dateB - dateA;
        });
        
        if (filteredOrders.length === 0) {
            ordersTable.innerHTML = `
                <div style="text-align: center; padding: 48px; color: #ccc;">
                    <p style="font-size: 18px; margin-bottom: 16px;">No orders found</p>
                    <p style="font-size: 14px;">When customers place orders, they will appear here.</p>
                </div>
            `;
            return;
        }
        
        let html = `
            <table class="orders-table">
                <thead>
                    <tr>
                        <th>Order #</th>
                        <th>Customer</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        filteredOrders.forEach(order => {
            const orderDate = order.date ? 
                new Date(order.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }) : 
                'N/A';
            
            const total = order.total || (order.items?.reduce((sum, item) => 
                sum + (item.price * item.quantity), 0) || 0);
            
            const status = order.status || 'Pending';
            const statusClass = status.toLowerCase();
            
            html += `
                <tr>
                    <td style="font-weight: bold; color: #d8b84d;">
                        ${order.order_number || 'ORD-' + (order.id || '').toString().slice(-6)}
                    </td>
                    <td>
                        <div style="font-weight: 500;">${order.user_name || 'Customer'}</div>
                        <div style="font-size: 12px; color: #ccc;">${order.user_email || ''}</div>
                    </td>
                    <td>
                        <div style="font-size: 14px;">${order.items?.length || 0} items</div>
                        <div style="font-size: 12px; color: #ccc;">
                            ${order.items?.slice(0, 2).map(item => `${item.quantity}x ${item.name}`).join(', ')}
                            ${order.items?.length > 2 ? ` +${order.items.length - 2} more` : ''}
                        </div>
                    </td>
                    <td style="font-weight: bold;">${total.toFixed(2)}€</td>
                    <td>
                        <span class="status-badge status-${statusClass}">
                            ${status}
                        </span>
                    </td>
                    <td style="font-size: 14px;">${orderDate}</td>
                    <td>
                        <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                            <button class="table-action-btn btn-view" onclick="staffDashboard.viewOrder(${order.id})">
                                View
                            </button>
                            ${status === 'Pending' ? 
                                `<button class="table-action-btn btn-prepare" onclick="staffDashboard.updateOrderStatus(${order.id}, 'Preparing')">
                                    Prepare
                                </button>` : ''}
                            ${status === 'Preparing' ? 
                                `<button class="table-action-btn btn-ready" onclick="staffDashboard.updateOrderStatus(${order.id}, 'Ready')">
                                    Ready
                                </button>` : ''}
                            ${status === 'Ready' ? 
                                `<button class="table-action-btn btn-deliver" onclick="staffDashboard.updateOrderStatus(${order.id}, 'Delivered')">
                                    Deliver
                                </button>` : ''}
                            ${status !== 'Delivered' && status !== 'Cancelled' ? 
                                `<button class="table-action-btn btn-cancel" onclick="staffDashboard.updateOrderStatus(${order.id}, 'Cancelled')">
                                    Cancel
                                </button>` : ''}
                        </div>
                    </td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        `;
        
        ordersTable.innerHTML = html;
        this.updateQuickStats();
    }
    
    updateQuickStats() {
        const allOrders = JSON.parse(localStorage.getItem('ombradoro_orders')) || [];
        
        // Pending orders
        const pendingOrders = allOrders.filter(order => 
            order.status === 'Pending' || !order.status
        ).length;
        document.getElementById('pendingCount').textContent = pendingOrders;
        
        // Today's orders
        const today = new Date().toDateString();
        const todayOrders = allOrders.filter(order => {
            const orderDate = new Date(order.timestamp || order.date || order.id).toDateString();
            return orderDate === today;
        }).length;
        document.getElementById('todayCount').textContent = todayOrders;
        
        // Total revenue (delivered orders only)
        const revenue = allOrders
            .filter(order => order.status === 'Delivered')
            .reduce((sum, order) => sum + (order.total || 0), 0);
        document.getElementById('revenueCount').textContent = revenue.toFixed(2) + '€';
    }
    
    viewOrder(orderId) {
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
                    background: #0b1214; border: 2px solid #d8b84d; border-radius: 12px;
                    width: 100%; max-width: 800px; max-height: 90vh; overflow-y: auto;
                    padding: 32px; position: relative;
                ">
                    <button onclick="this.closest('.order-details-modal').remove()" style="
                        position: absolute; top: 16px; right: 16px; background: none;
                        border: none; color: #d8b84d; font-size: 24px; cursor: pointer;
                        width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
                    ">&times;</button>
                    
                    <h2 style="color: #d8b84d; margin-bottom: 24px; font-family: 'Playfair Display', serif; font-size: 30px;">
                        Order Details
                    </h2>
                    
                    <!-- Order Info -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px;">
                        <div>
                            <h3 style="color: #d8b84d; margin-bottom: 12px; font-family: 'Raleway', sans-serif; font-size: 18px;">Order Information</h3>
                            <p style="margin-bottom: 8px;"><strong>Order Number:</strong> ${order.order_number || 'N/A'}</p>
                            <p style="margin-bottom: 8px;"><strong>Order Date:</strong> ${new Date(order.date || order.id).toLocaleString()}</p>
                            <p style="margin-bottom: 8px;"><strong>Status:</strong> <span class="status-badge status-${order.status?.toLowerCase()}">${order.status || 'Pending'}</span></p>
                            <p style="margin-bottom: 8px;"><strong>Total Amount:</strong> ${total.toFixed(2)}€</p>
                        </div>
                        <div>
                            <h3 style="color: #d8b84d; margin-bottom: 12px; font-family: 'Raleway', sans-serif; font-size: 18px;">Customer Information</h3>
                            <p style="margin-bottom: 8px;"><strong>Name:</strong> ${order.user_name || 'N/A'}</p>
                            <p style="margin-bottom: 8px;"><strong>Email:</strong> ${order.user_email || 'N/A'}</p>
                            <p style="margin-bottom: 8px;"><strong>Phone:</strong> ${order.user_phone || 'N/A'}</p>
                            <p style="margin-bottom: 8px;"><strong>Delivery Address:</strong> ${order.address || 'Not specified'}</p>
                        </div>
                    </div>
                    
                    <!-- Order Items -->
                    <div style="margin-bottom: 32px;">
                        <h3 style="color: #d8b84d; margin-bottom: 16px; font-family: 'Raleway', sans-serif; font-size: 18px;">Order Items</h3>
                        <div style="background: #060c0e; border-radius: 8px; overflow: hidden;">
                            <div style="display: grid; grid-template-columns: 3fr 1fr 1fr 1fr; 
                                    background: #011922; padding: 16px; font-weight: bold; color: #d8b84d; font-size: 14px;">
                                <div>Item</div>
                                <div style="text-align: center;">Price</div>
                                <div style="text-align: center;">Qty</div>
                                <div style="text-align: right;">Subtotal</div>
                            </div>
                            ${order.items?.map(item => `
                                <div style="
                                    display: grid; grid-template-columns: 3fr 1fr 1fr 1fr;
                                    padding: 16px; border-bottom: 1px solid #2a3a40;
                                    align-items: center;
                                ">
                                    <div style="color: #fff; font-weight: 500;">
                                        ${item.name}
                                        ${item.ingredients ? `<div style="color: #888; font-size: 12px; margin-top: 4px;">${item.ingredients}</div>` : ''}
                                    </div>
                                    <div style="text-align: center; color: #d8b84d;">${item.price}€</div>
                                    <div style="text-align: center; color: #ccc;">${item.quantity}</div>
                                    <div style="text-align: right; color: #d8b84d; font-weight: bold;">
                                        ${(item.price * item.quantity).toFixed(2)}€
                                    </div>
                                </div>
                            `).join('')}
                            <div style="
                                display: grid; grid-template-columns: 3fr 1fr 1fr 1fr;
                                padding: 16px; background: #011922; font-weight: bold; font-size: 16px;
                            ">
                                <div style="text-align: right; grid-column: 1 / 4; color: #ccc;">Total Amount:</div>
                                <div style="text-align: right; color: #d8b84d;">${total.toFixed(2)}€</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Status Update -->
                    <div>
                        <h3 style="color: #d8b84d; margin-bottom: 16px; font-family: 'Raleway', sans-serif; font-size: 18px;">Update Status</h3>
                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                            <button onclick="staffDashboard.updateOrderStatus(${order.id}, 'Preparing')" style="
                                padding: 10px 20px; background: #17a2b8; color: white; border: none;
                                border-radius: 6px; cursor: pointer; font-family: 'Raleway', sans-serif; font-weight: 600;
                            " ${order.status === 'Preparing' || order.status === 'Ready' || order.status === 'Delivered' || order.status === 'Cancelled' ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                                Mark as Preparing
                            </button>
                            <button onclick="staffDashboard.updateOrderStatus(${order.id}, 'Ready')" style="
                                padding: 10px 20px; background: #28a745; color: white; border: none;
                                border-radius: 6px; cursor: pointer; font-family: 'Raleway', sans-serif; font-weight: 600;
                            " ${order.status === 'Ready' || order.status === 'Delivered' || order.status === 'Cancelled' ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                                Mark as Ready
                            </button>
                            <button onclick="staffDashboard.updateOrderStatus(${order.id}, 'Delivered')" style="
                                padding: 10px 20px; background: #6c757d; color: white; border: none;
                                border-radius: 6px; cursor: pointer; font-family: 'Raleway', sans-serif; font-weight: 600;
                            " ${order.status === 'Delivered' || order.status === 'Cancelled' ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                                Mark as Delivered
                            </button>
                            <button onclick="staffDashboard.updateOrderStatus(${order.id}, 'Cancelled')" style="
                                padding: 10px 20px; background: #dc3545; color: white; border: none;
                                border-radius: 6px; cursor: pointer; font-family: 'Raleway', sans-serif; font-weight: 600;
                            " ${order.status === 'Cancelled' ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                                Cancel Order
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    updateOrderStatus(orderId, newStatus) {
        const allOrders = JSON.parse(localStorage.getItem('ombradoro_orders')) || [];
        const orderIndex = allOrders.findIndex(o => o.id === orderId);
        
        if (orderIndex === -1) {
            this.showNotification('Order not found', 'error');
            return;
        }
        
        const order = allOrders[orderIndex];
        const oldStatus = order.status || 'Pending';
        
        // Update order
        order.status = newStatus;
        
        // Add to status history
        if (!order.status_history) order.status_history = [];
        order.status_history.push({
            status: newStatus,
            date: new Date().toISOString(),
            changed_by: this.currentStaff.name,
            notes: `Changed from ${oldStatus} to ${newStatus}`
        });
        
        // Save back to localStorage
        allOrders[orderIndex] = order;
        localStorage.setItem('ombradoro_orders', JSON.stringify(allOrders));
        
        this.showNotification(`Order status updated to ${newStatus}`);
        
        // Refresh orders display
        this.loadOrders();
        
        // Close modal if open
        const modal = document.querySelector('.order-details-modal');
        if (modal) modal.remove();
    }
    
    loadMenuItems() {
        // يمكن تطويرها لاحقاً
        document.getElementById('menuItemsContainer').innerHTML = `
            <div style="text-align: center; padding: 48px; color: #ccc;">
                <p style="font-size: 18px; margin-bottom: 16px;">Menu Management</p>
                <p style="font-size: 14px;">Coming soon...</p>
            </div>
        `;
    }
    
    loadCustomers() {
        const users = JSON.parse(localStorage.getItem('ombradoro_users')) || [];
        
        if (users.length === 0) {
            document.getElementById('customersContainer').innerHTML = `
                <div style="text-align: center; padding: 48px; color: #ccc;">
                    <p style="font-size: 18px; margin-bottom: 16px;">No customers found</p>
                    <p style="font-size: 14px;">When customers register, they will appear here.</p>
                </div>
            `;
            return;
        }
        
        let html = `
            <div style="background: #060c0e; border-radius: 12px; border: 1px solid #2a3a40; overflow: hidden;">
                <div style="display: grid; grid-template-columns: 2fr 2fr 1fr 1fr; 
                        background: #011922; padding: 20px; font-weight: bold; color: #d8b84d; font-size: 14px;">
                    <div>Name</div>
                    <div>Email</div>
                    <div>Phone</div>
                    <div>Orders</div>
                </div>
        `;
        
        users.forEach(user => {
            // Count user's orders
            const allOrders = JSON.parse(localStorage.getItem('ombradoro_orders')) || [];
            const userOrders = allOrders.filter(order => 
                order.user_id === user.id || 
                order.user_email === user.email ||
                order.user_name === user.name
            ).length;
            
            html += `
                <div style="
                    display: grid; grid-template-columns: 2fr 2fr 1fr 1fr;
                    padding: 20px; border-bottom: 1px solid #2a3a40;
                    align-items: center;
                ">
                    <div style="color: #fff; font-weight: 500;">${user.name}</div>
                    <div style="color: #ccc;">${user.email}</div>
                    <div style="color: #ccc;">${user.phone || 'N/A'}</div>
                    <div style="color: #d8b84d; font-weight: bold;">${userOrders}</div>
                </div>
            `;
        });
        
        html += `</div>`;
        document.getElementById('customersContainer').innerHTML = html;
    }
    
    loadStatistics() {
        const allOrders = JSON.parse(localStorage.getItem('ombradoro_orders')) || [];
        const users = JSON.parse(localStorage.getItem('ombradoro_users')) || [];
        
        // Calculate statistics
        const totalOrders = allOrders.length;
        const completedOrders = allOrders.filter(o => o.status === 'Delivered').length;
        const cancelledOrders = allOrders.filter(o => o.status === 'Cancelled').length;
        const totalRevenue = allOrders
            .filter(o => o.status === 'Delivered')
            .reduce((sum, o) => sum + (o.total || 0), 0);
        
        // Orders by status
        const ordersByStatus = {};
        allOrders.forEach(order => {
            const status = order.status || 'Pending';
            ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;
        });
        
        let html = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 24px; margin-bottom: 32px;">
                <div style="background: #060c0e; border-radius: 12px; padding: 24px; border: 1px solid #2a3a40;">
                    <div style="color: #d8b84d; font-size: 14px; margin-bottom: 8px;">Total Customers</div>
                    <div style="font-size: 36px; font-weight: bold; color: #fff;">${users.length}</div>
                </div>
                <div style="background: #060c0e; border-radius: 12px; padding: 24px; border: 1px solid #2a3a40;">
                    <div style="color: #d8b84d; font-size: 14px; margin-bottom: 8px;">Total Orders</div>
                    <div style="font-size: 36px; font-weight: bold; color: #fff;">${totalOrders}</div>
                </div>
                <div style="background: #060c0e; border-radius: 12px; padding: 24px; border: 1px solid #2a3a40;">
                    <div style="color: #d8b84d; font-size: 14px; margin-bottom: 8px;">Completed Orders</div>
                    <div style="font-size: 36px; font-weight: bold; color: #fff;">${completedOrders}</div>
                </div>
                <div style="background: #060c0e; border-radius: 12px; padding: 24px; border: 1px solid #2a3a40;">
                    <div style="color: #d8b84d; font-size: 14px; margin-bottom: 8px;">Total Revenue</div>
                    <div style="font-size: 36px; font-weight: bold; color: #fff;">${totalRevenue.toFixed(2)}€</div>
                </div>
            </div>
            
            <div style="background: #060c0e; border-radius: 12px; padding: 24px; border: 1px solid #2a3a40;">
                <h3 style="color: #d8b84d; margin-bottom: 20px; font-family: 'Raleway', sans-serif;">Orders by Status</h3>
                <div style="display: flex; flex-direction: column; gap: 12px;">
        `;
        
        Object.entries(ordersByStatus).forEach(([status, count]) => {
            const percentage = totalOrders > 0 ? (count / totalOrders * 100).toFixed(1) : 0;
            const statusClass = status.toLowerCase();
            
            html += `
                <div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="color: #ccc;">${status}</span>
                        <span style="color: #d8b84d; font-weight: bold;">${count} (${percentage}%)</span>
                    </div>
                    <div style="height: 8px; background: #2a3a40; border-radius: 4px; overflow: hidden;">
                        <div style="height: 100%; width: ${percentage}%; background: #d8b84d; border-radius: 4px;"></div>
                    </div>
                </div>
            `;
        });
        
        html += `</div></div>`;
        document.getElementById('statsContainer').innerHTML = html;
    }
    
    showAddMenuItemModal() {
        // يمكن تطويرها لاحقاً
        this.showNotification('Menu management coming soon!');
    }
    
    showError(message) {
        const errorElement = document.getElementById('loginError');
        if (errorElement) {
            errorElement.textContent = message;
            setTimeout(() => {
                errorElement.textContent = '';
            }, 3000);
        }
    }
    
    showNotification(message, type = 'success') {
        const notification = document.getElementById('staffNotification');
        if (!notification) return;
        
        notification.textContent = message;
        notification.className = 'notification';
        
        if (type === 'error') {
            notification.style.background = '#dc3545';
        } else if (type === 'success') {
            notification.style.background = '#28a745';
        } else {
            notification.style.background = '#d8b84d';
        }
        
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

// Initialize staff dashboard
const staffDashboard = new StaffDashboard();
window.staffDashboard = staffDashboard;