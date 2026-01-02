# backend/routes/cart_routes.py
from flask import Blueprint, request, jsonify
from models import db, ShoppingCart, MenuItem, User
from middleware import token_required
from datetime import datetime

cart_bp = Blueprint('cart', __name__, url_prefix='/api/cart')

# Get cart items
@cart_bp.route('/', methods=['GET'])
@token_required
def get_cart():
    try:
        user_id = request.user_id
        
        cart_items = ShoppingCart.query.filter_by(User_ID=user_id).all()
        
        cart_with_details = []
        total = 0
        
        for cart_item in cart_items:
            menu_item = MenuItem.query.get(cart_item.Item_ID)
            if menu_item and menu_item.IsAvailable:
                subtotal = menu_item.Price * cart_item.Quantity
                total += subtotal
                
                cart_with_details.append({
                    'cart_id': cart_item.Cart_ID,
                    'item_id': cart_item.Item_ID,
                    'quantity': cart_item.Quantity,
                    'name': menu_item.Name,
                    'description': menu_item.Description,
                    'price': menu_item.Price,
                    'image_url': menu_item.ImageURL,
                    'subtotal': subtotal,
                    'added_at': cart_item.AddedAt.isoformat() if cart_item.AddedAt else None
                })
        
        return jsonify({
            'success': True,
            'items': cart_with_details,
            'total': total,
            'item_count': len(cart_with_details)
        })
        
    except Exception as e:
        print(f"Error getting cart: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# Add item to cart
@cart_bp.route('/add', methods=['POST'])
@token_required
def add_to_cart():
    try:
        data = request.json
        item_id = data.get('item_id')
        quantity = data.get('quantity', 1)
        
        if not item_id:
            return jsonify({'success': False, 'error': 'Item ID required'}), 400
        
        user_id = request.user_id
        
        # Check if item exists and is available
        menu_item = MenuItem.query.get(item_id)
        if not menu_item or not menu_item.IsAvailable:
            return jsonify({'success': False, 'error': 'Item not available'}), 400
        
        # Check if item already in cart
        existing_item = ShoppingCart.query.filter_by(
            User_ID=user_id, 
            Item_ID=item_id
        ).first()
        
        if existing_item:
            existing_item.Quantity += quantity
        else:
            new_cart_item = ShoppingCart(
                User_ID=user_id,
                Item_ID=item_id,
                Quantity=quantity,
                AddedAt=datetime.utcnow()
            )
            db.session.add(new_cart_item)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Item added to cart'
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Error adding to cart: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# Update cart item quantity
@cart_bp.route('/update', methods=['PUT'])
@token_required
def update_cart():
    try:
        data = request.json
        item_id = data.get('item_id')
        quantity = data.get('quantity')
        
        if not item_id or quantity is None:
            return jsonify({'success': False, 'error': 'Item ID and quantity required'}), 400
        
        user_id = request.user_id
        
        cart_item = ShoppingCart.query.filter_by(
            User_ID=user_id, 
            Item_ID=item_id
        ).first()
        
        if not cart_item:
            return jsonify({'success': False, 'error': 'Item not in cart'}), 404
        
        if quantity <= 0:
            db.session.delete(cart_item)
        else:
            cart_item.Quantity = quantity
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Cart updated'
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Error updating cart: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# Remove item from cart
@cart_bp.route('/remove/<int:item_id>', methods=['DELETE'])
@token_required
def remove_from_cart(item_id):
    try:
        user_id = request.user_id
        
        cart_item = ShoppingCart.query.filter_by(
            User_ID=user_id, 
            Item_ID=item_id
        ).first()
        
        if not cart_item:
            return jsonify({'success': False, 'error': 'Item not in cart'}), 404
        
        db.session.delete(cart_item)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Item removed from cart'
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Error removing from cart: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# Clear cart
@cart_bp.route('/clear', methods=['DELETE'])
@token_required
def clear_cart():
    try:
        user_id = request.user_id
        
        ShoppingCart.query.filter_by(User_ID=user_id).delete()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Cart cleared'
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Error clearing cart: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500