# backend/models.py
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'Users'
    
    User_ID = db.Column(db.Integer, primary_key=True)
    Name = db.Column(db.String(100), nullable=False)
    Email = db.Column(db.String(150), unique=True, nullable=False)
    Phone = db.Column(db.String(20), nullable=False)
    PasswordHash = db.Column(db.String(255), nullable=False)
    CreatedAt = db.Column(db.DateTime, default=datetime.utcnow)
    #Address = db.Column(db.String(500), nullable=True)
    
    def set_password(self, password):
        self.PasswordHash = password  # Store plain text for now
    
    def check_password(self, password):
        return self.PasswordHash == password  # Compare plain text
    
    def to_dict(self):
        return {
            'id': self.User_ID,
            'name': self.Name,
            'email': self.Email,
            'phone': self.Phone,
            #'address': self.Address if hasattr(self, 'Address') else None,  # Safe access
            'created_at': self.CreatedAt.isoformat() if self.CreatedAt else None
        }

class Staff(db.Model):
    __tablename__ = 'Staff'
    
    Staff_ID = db.Column(db.Integer, primary_key=True)
    Username = db.Column(db.String(50), unique=True, nullable=False)
    Name = db.Column(db.String(100), nullable=False)
    Role = db.Column(db.String(20), nullable=False)
    PasswordHash = db.Column(db.String(255), nullable=False)
    CreatedAt = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.Staff_ID,
            'username': self.Username,
            'name': self.Name,
            'role': self.Role
        }

class MenuItem(db.Model):
    __tablename__ = 'MenuItems'
    
    Item_ID = db.Column(db.Integer, primary_key=True)
    Name = db.Column(db.String(100), nullable=False)
    Description = db.Column(db.String(500))
    Price = db.Column(db.Float, nullable=False)
    Category = db.Column(db.String(50))
    ImageURL = db.Column(db.String(255))
    IsAvailable = db.Column(db.Boolean, default=True)
    CreatedAt = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.Item_ID,
            'name': self.Name,
            'description': self.Description,
            'price': self.Price,
            'category': self.Category,
            'image_url': self.ImageURL,
            'is_available': self.IsAvailable
        }

class Order(db.Model):
    __tablename__ = 'Orders'
    
    Order_ID = db.Column(db.Integer, primary_key=True)
    OrderNumber = db.Column(db.String(20), unique=True, nullable=False)
    User_ID = db.Column(db.Integer, db.ForeignKey('Users.User_ID'), nullable=False)
    Staff_ID = db.Column(db.Integer, db.ForeignKey('Staff.Staff_ID'))
    OrderType = db.Column(db.String(10), default='Delivery')
    Status = db.Column(db.String(20), default='Pending')
    TotalAmount = db.Column(db.Float, default=0)
    DeliveryAddress = db.Column(db.String(500))
    PaymentMethod = db.Column(db.String(20), default='Cash')
    PaymentStatus = db.Column(db.String(20), default='Pending')
    OrderNotes = db.Column(db.String(1000))
    CreatedAt = db.Column(db.DateTime, default=datetime.utcnow)
    UpdatedAt = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    staff = db.relationship('Staff', backref='orders')
    order_items = db.relationship('OrderItem', backref='order', lazy=True)
    status_history = db.relationship('OrderStatusHistory', backref='order', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.Order_ID,
            'order_number': self.OrderNumber,
            'user_id': self.User_ID,
            'staff_id': self.Staff_ID,
            'order_type': self.OrderType,
            'status': self.Status,
            'total_amount': self.TotalAmount,
            'delivery_address': self.DeliveryAddress,
            'payment_method': self.PaymentMethod,
            'payment_status': self.PaymentStatus,
            'created_at': self.CreatedAt.isoformat() if self.CreatedAt else None,
            'customer_name': self.customer.Name if self.customer else None
        }

class OrderItem(db.Model):
    __tablename__ = 'OrderItems'
    
    OrderItem_ID = db.Column(db.Integer, primary_key=True)
    Order_ID = db.Column(db.Integer, db.ForeignKey('Orders.Order_ID'), nullable=False)
    Item_ID = db.Column(db.Integer, db.ForeignKey('MenuItems.Item_ID'), nullable=False)
    Quantity = db.Column(db.Integer, nullable=False)
    PriceAtTime = db.Column(db.Float, nullable=False)
    
    # Relationship
    menu_item = db.relationship('MenuItem')
    
    def to_dict(self):
        return {
            'id': self.OrderItem_ID,
            'order_id': self.Order_ID,
            'item_id': self.Item_ID,
            'quantity': self.Quantity,
            'price_at_time': self.PriceAtTime,
            'subtotal': self.Quantity * self.PriceAtTime,
            'item_name': self.menu_item.Name if self.menu_item else None
        }

class OrderStatusHistory(db.Model):
    __tablename__ = 'OrderStatusHistory'
    
    History_ID = db.Column(db.Integer, primary_key=True)
    Order_ID = db.Column(db.Integer, db.ForeignKey('Orders.Order_ID'), nullable=False)
    OldStatus = db.Column(db.String(20))
    NewStatus = db.Column(db.String(20), nullable=False)
    ChangedBy = db.Column(db.Integer, db.ForeignKey('Staff.Staff_ID'))
    ChangedAt = db.Column(db.DateTime, default=datetime.utcnow)
    Notes = db.Column(db.String(500))
    
    # Relationship
    staff = db.relationship('Staff')
    
    def to_dict(self):
        return {
            'id': self.History_ID,
            'order_id': self.Order_ID,
            'old_status': self.OldStatus,
            'new_status': self.NewStatus,
            'changed_by': self.ChangedBy,
            'changed_at': self.ChangedAt.isoformat() if self.ChangedAt else None,
            'notes': self.Notes,
            'staff_name': self.staff.Name if self.staff else None
        }

class ShoppingCart(db.Model):
    __tablename__ = 'ShoppingCart'
    
    Cart_ID = db.Column(db.Integer, primary_key=True)
    User_ID = db.Column(db.Integer, db.ForeignKey('Users.User_ID'), nullable=False)
    Item_ID = db.Column(db.Integer, db.ForeignKey('MenuItems.Item_ID'), nullable=False)
    Quantity = db.Column(db.Integer, default=1, nullable=False)
    AddedAt = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    menu_item = db.relationship('MenuItem')
    
    def to_dict(self):
        return {
            'id': self.Cart_ID,
            'user_id': self.User_ID,
            'item_id': self.Item_ID,
            'quantity': self.Quantity,
            'added_at': self.AddedAt.isoformat() if self.AddedAt else None,
            'item_name': self.menu_item.Name if self.menu_item else None,
            'item_price': self.menu_item.Price if self.menu_item else None,
            'subtotal': self.Quantity * (self.menu_item.Price if self.menu_item else 0)
        }