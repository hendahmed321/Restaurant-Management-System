# backend/routes/menu_routes.py
from flask import Blueprint, jsonify
from models import MenuItem

menu_bp = Blueprint('menu', __name__)

@menu_bp.route('/', methods=['GET'])
def get_menu():
    items = MenuItem.query.filter_by(IsAvailable=True).all()
    return jsonify([item.to_dict() for item in items])

@menu_bp.route('/<int:item_id>', methods=['GET'])
def get_menu_item(item_id):
    item = MenuItem.query.get(item_id)
    if not item:
        return jsonify({'error': 'Item not found'}), 404
    return jsonify(item.to_dict())

@menu_bp.route('/categories', methods=['GET'])
def get_categories():
    categories = db.session.query(MenuItem.Category).distinct().all()
    return jsonify([cat[0] for cat in categories if cat[0]])