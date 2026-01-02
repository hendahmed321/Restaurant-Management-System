-- Create the database
CREATE DATABASE RestaurantDB;
USE RestaurantDB;

-- 1. Customers table
CREATE TABLE Users (
    User_ID INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL,
    Email NVARCHAR(150) UNIQUE NOT NULL,
    Phone NVARCHAR(20) NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- 2. Staff table
CREATE TABLE Staff (
    Staff_ID INT PRIMARY KEY IDENTITY(1,1),
    Username NVARCHAR(50) UNIQUE NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    Role NVARCHAR(20) NOT NULL CHECK (Role IN ('Manager', 'Kitchen', 'Cashier', 'Delivery')),
    PasswordHash NVARCHAR(255) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- 3. Menu items table
CREATE TABLE MenuItems (
    Item_ID INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500),
    Price DECIMAL(10,2) NOT NULL CHECK (Price > 0),
    Category NVARCHAR(50),
    ImageURL NVARCHAR(255),
    IsAvailable BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- 4. Orders table
CREATE TABLE Orders (
    Order_ID INT PRIMARY KEY IDENTITY(1,1),
    OrderNumber NVARCHAR(20) UNIQUE NOT NULL,
    User_ID INT NOT NULL,
    Staff_ID INT NULL,
    OrderType NVARCHAR(10) DEFAULT 'Delivery' CHECK (OrderType IN ('Delivery', 'Pickup')),
    Status NVARCHAR(20) DEFAULT 'Pending' CHECK (Status IN ('Pending', 'Preparing', 'Ready', 'Delivered', 'Cancelled')),
    TotalAmount DECIMAL(10,2) DEFAULT 0,
    DeliveryAddress NVARCHAR(500),
    PaymentMethod NVARCHAR(20) DEFAULT 'Cash' CHECK (PaymentMethod IN ('Cash', 'Card')),
    PaymentStatus NVARCHAR(20) DEFAULT 'Pending' CHECK (PaymentStatus IN ('Pending', 'Paid', 'Failed')),
    OrderNotes NVARCHAR(1000),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    
    FOREIGN KEY (User_ID) REFERENCES Users(User_ID),
    FOREIGN KEY (Staff_ID) REFERENCES Staff(Staff_ID)
);

-- 5. Order items (what's in each order)
CREATE TABLE OrderItems (
    OrderItem_ID INT PRIMARY KEY IDENTITY(1,1),
    Order_ID INT NOT NULL,
    Item_ID INT NOT NULL,
    Quantity INT NOT NULL CHECK (Quantity > 0),
    PriceAtTime DECIMAL(10,2) NOT NULL,
    
    FOREIGN KEY (Order_ID) REFERENCES Orders(Order_ID) ON DELETE CASCADE,
    FOREIGN KEY (Item_ID) REFERENCES MenuItems(Item_ID)
);

-- 6. order status history
CREATE TABLE OrderStatusHistory (
    History_ID INT PRIMARY KEY IDENTITY(1,1),
    Order_ID INT NOT NULL,
    OldStatus NVARCHAR(20),
    NewStatus NVARCHAR(20) NOT NULL,
    ChangedBy INT,
    ChangedAt DATETIME DEFAULT GETDATE(),
    Notes NVARCHAR(500),
    
    FOREIGN KEY (Order_ID) REFERENCES Orders(Order_ID) ON DELETE CASCADE,
    FOREIGN KEY (ChangedBy) REFERENCES Staff(Staff_ID)
);

-- shopping cart
CREATE TABLE ShoppingCart (
    Cart_ID INT PRIMARY KEY IDENTITY(1,1),
    User_ID INT NOT NULL,
    Item_ID INT NOT NULL,
    Quantity INT NOT NULL DEFAULT 1 CHECK (Quantity > 0),
    AddedAt DATETIME DEFAULT GETDATE(),
    
    FOREIGN KEY (User_ID) REFERENCES Users(User_ID) ON DELETE CASCADE,
    FOREIGN KEY (Item_ID) REFERENCES MenuItems(Item_ID),
    
    UNIQUE (User_ID, Item_ID)
);

-- DATA INSERTION
-- 1. Staff 
INSERT INTO Staff (Username, Name, Role, PasswordHash) VALUES
('admin', 'Hend Ahmed', 'Manager', 'admin123'),
('chef', 'Nada Khalil', 'Kitchen', 'chef123'),
('cashier', 'Hala Mohammed', 'Cashier', 'cash123');

-- 2. Menu Items 
INSERT INTO MenuItems (Name, Description, Price, Category) VALUES
('Margherita Pizza', 'Classic cheese pizza', 45.00, 'Pizza'),
('Beef Burger', 'Beef burger with fries', 35.00, 'Burger'),
('Caesar Salad', 'Fresh salad', 25.00, 'Salad'),
('Cola', 'Cold drink', 8.00, 'Drink'),
('Water', 'Bottled water', 5.00, 'Drink');

-- 3. Customers 
INSERT INTO Users (Name, Email, Phone, PasswordHash) VALUES
('Ahmed', 'ahmed@test.com', '0101111111', 'ahmed123'),
('Sara', 'sara@test.com', '0102222222', 'sara123'),
('Omar', 'omar@test.com', '0103333333', 'omar123');

-- 4. One sample order
DECLARE @OrderID INT;
INSERT INTO Orders (OrderNumber, User_ID, Staff_ID, OrderType, Status, TotalAmount) 
VALUES ('ORD-001', 1, 2, 'Delivery', 'Delivered', 53.00);
SET @OrderID = SCOPE_IDENTITY();

INSERT INTO OrderItems (Order_ID, Item_ID, Quantity, PriceAtTime) VALUES
(@OrderID, 1, 1, 45.00),  -- 1 Pizza
(@OrderID, 4, 1, 8.00);   -- 1 Cola

-- 5. Shopping cart 
INSERT INTO ShoppingCart (User_ID, Item_ID, Quantity) VALUES
(2, 2, 2),  -- Sara has 2 burgers in cart
(2, 5, 1);  -- Sara has 1 water in cart

-- See all tables
SELECT * FROM Users;
SELECT * FROM Staff;
SELECT * FROM MenuItems;
SELECT * FROM OrderItems;
SELECT * FROM Orders;
SELECT * FROM OrderStatusHistory;
SELECT * FROM ShoppingCart;

