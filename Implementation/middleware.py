# backend/middleware.py
from flask import request, jsonify
from functools import wraps
from auth_utils import verify_token

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            token = auth_header.replace('Bearer ', '')
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        try:
            payload = verify_token(token)
            if not payload:
                return jsonify({'message': 'Token is invalid!'}), 401
            
            request.user_id = payload['user_id']
            request.user_type = payload['user_type']
            
        except Exception as e:
            return jsonify({'message': 'Token is invalid!'}), 401
        
        return f(*args, **kwargs)
    
    return decorated