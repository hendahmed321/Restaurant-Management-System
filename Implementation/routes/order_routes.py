# backend/routes/order_routes.py
from flask import Blueprint, request, jsonify
from models import db, Order, OrderItem, ShoppingCart, MenuItem, OrderStatusHistory, User
from datetime import datetime

order_bp = Blueprint('orders', __name__)
@order_bp.route('/', methods=['POST'])
def create_order():
    """Create a new order from cart"""
    try:
        data = request.json
        
        # Generate order number
        order_number = f"ORD-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Create order
        order = {
            'order_number': order_number,
            'user_id': data.get('user_id'),
            'order_type': 'Delivery',
            'status': 'Pending',
            'total_amount': data.get('total', 0),
            'delivery_address': data.get('delivery_address'),
            'payment_method': data.get('payment_method', 'cash'),
            'order_notes': data.get('notes', '')
        }
        
        # TODO: Save to database
        
        return jsonify({
            'success': True,
            'message': 'Order created',
            'order': order
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    
@order_bp.route('/', methods=['GET'])
def get_orders():
    status = request.args.get('status', 'all')
    
    if status == 'all':
        orders = Order.query.all()
    else:
        orders = Order.query.filter_by(Status=status).order_by(Order.CreatedAt.desc()).all()
    
    # Include customer name in response
    orders_with_customer = []
    for order in orders:
        order_dict = order.to_dict()
        # Get customer name
        customer = User.query.get(order.User_ID)
        if customer:
            order_dict['customer_name'] = customer.Name
        else:
            order_dict['customer_name'] = 'Unknown Customer'
        
        # Get order items
        order_items = OrderItem.query.filter_by(Order_ID=order.Order_ID).all()
        order_dict['order_items'] = [item.to_dict() for item in order_items]
        
        orders_with_customer.append(order_dict)
    
    return jsonify(orders_with_customer)

@order_bp.route('/', methods=['POST'])
def create_order():
    try:
        data = request.json
        user_id = data.get('user_id', 1)  # Default to 1 for demo
        
        # Generate order number
        order_number = f"ORD-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        
        # Calculate total from cart items
        cart_items = data.get('items', [])
        if not cart_items:
            return jsonify({'success': False, 'error': 'Cart is empty'}), 400
        
        total_amount = 0
        for item in cart_items:
            menu_item = MenuItem.query.get(item.get('id'))
            if menu_item:
                total_amount += menu_item.Price * item.get('quantity', 1)
        
        # Create order
        new_order = Order(
            OrderNumber=order_number,
            User_ID=user_id,
            OrderType=data.get('order_type', 'Delivery'),
            Status='Pending',
            TotalAmount=total_amount,
            DeliveryAddress=data.get('delivery_address'),
            PaymentMethod=data.get('payment_method', 'Cash'),
            PaymentStatus='Pending',
            OrderNotes=data.get('notes', ''),
            CreatedAt=datetime.utcnow(),
            UpdatedAt=datetime.utcnow()
        )
        
        db.session.add(new_order)
        db.session.flush()  # Get the order ID
        
        # Add order items
        for item in cart_items:
            menu_item = MenuItem.query.get(item.get('id'))
            if menu_item and menu_item.IsAvailable:
                order_item = OrderItem(
                    Order_ID=new_order.Order_ID,
                    Item_ID=menu_item.Item_ID,
                    Quantity=item.get('quantity', 1),
                    PriceAtTime=menu_item.Price
                )
                db.session.add(order_item)
        
        # Add initial status history
        status_history = OrderStatusHistory(
            Order_ID=new_order.Order_ID,
            NewStatus='Pending',
            Notes='Order created by customer'
        )
        db.session.add(status_history)
        
        db.session.commit()
        
        # Get customer name for response
        customer = User.query.get(user_id)
        customer_name = customer.Name if customer else 'Customer'
        
        order_response = {
            'id': new_order.Order_ID,
            'order_number': order_number,
            'user_id': user_id,
            'customer_name': customer_name,
            'order_type': new_order.OrderType,
            'status': new_order.Status,
            'total_amount': total_amount,
            'delivery_address': new_order.DeliveryAddress,
            'payment_method': new_order.PaymentMethod,
            'created_at': new_order.CreatedAt.isoformat() if new_order.CreatedAt else None
        }
        
        return jsonify({
            'success': True,
            'message': 'Order created successfully',
            'order': order_response
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creating order: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@order_bp.route('/<int:order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    try:
        data = request.json
        new_status = data.get('status')
        staff_id = data.get('staff_id')
        notes = data.get('notes', '')
        
        order = Order.query.get(order_id)
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        # Update order
        old_status = order.Status
        order.Status = new_status
        order.UpdatedAt = datetime.utcnow()
        
        if staff_id:
            order.Staff_ID = staff_id
        
        # Add to status history
        status_history = OrderStatusHistory(
            Order_ID=order_id,
            OldStatus=old_status,
            NewStatus=new_status,
            ChangedBy=staff_id,
            Notes=notes
        )
        db.session.add(status_history)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Order status updated',
            'order': order.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500