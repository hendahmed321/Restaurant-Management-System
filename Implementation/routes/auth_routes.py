# backend/routes/auth_routes.py - NO JWT VERSION
from flask import Blueprint, request, jsonify
import pyodbc
import time
import hashlib

auth_bp = Blueprint('auth', __name__)

# Simple database connection function
def get_db_connection():
    conn = pyodbc.connect(
        'DRIVER={ODBC Driver 17 for SQL Server};'
        'SERVER=localhost;'
        'DATABASE=RestaurantDB;'
        'Trusted_Connection=yes;'
    )
    return conn

# Simple token generator (no JWT)
def create_simple_token(user_id, user_type='customer'):
    timestamp = str(int(time.time()))
    token_string = f"{user_type}_{user_id}_{timestamp}"
    
    # Create a simple hash
    token_hash = hashlib.md5(token_string.encode()).hexdigest()
    return f"{user_type}_{user_id}_{token_hash[:16]}"

@auth_bp.route('/login', methods=['POST'])
def customer_login():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        
        print(f"LOGIN ATTEMPT: Email: {email}")
        
        if not email or not password:
            return jsonify({'success': False, 'message': 'Email and password required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Query for user
        cursor.execute("""
            SELECT User_ID, Name, Email, Phone, PasswordHash, CreatedAt 
            FROM Users 
            WHERE Email = ?
        """, email)
        
        user = cursor.fetchone()
        conn.close()
        
        if user:
            print(f"USER FOUND: {user.Name}")
            print(f"DB PASSWORD: {user.PasswordHash}")
            print(f"INPUT PASSWORD: {password}")
            
            # Compare passwords (plain text)
            if str(user.PasswordHash) == str(password):
                print("✅ PASSWORD MATCHES!")
                
                # Create response data
                user_data = {
                    'id': user.User_ID,
                    'name': user.Name,
                    'email': user.Email,
                    'phone': user.Phone,
                    'created_at': user.CreatedAt.isoformat() if user.CreatedAt else None
                }
                
                # Create simple token
                token = create_simple_token(user.User_ID, 'customer')
                
                return jsonify({
                    'success': True,
                    'message': 'Login successful',
                    'user': user_data,
                    'token': token
                })
            else:
                print("❌ PASSWORD DOES NOT MATCH")
                return jsonify({'success': False, 'message': 'Invalid password'}), 401
        else:
            print("❌ USER NOT FOUND")
            return jsonify({'success': False, 'message': 'User not found'}), 401
        
    except Exception as e:
        print(f"❌ LOGIN ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'Login error: {str(e)}'}), 500

# Add debug/test endpoint
@auth_bp.route('/test-login', methods=['POST'])
def test_login():
    """Test endpoint to verify login works"""
    test_data = {
        'email': 'sara@test.com',
        'password': 'sara123'
    }
    
    # Simulate the login process
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM Users WHERE Email = ?", test_data['email'])
    user = cursor.fetchone()
    conn.close()
    
    if user:
        return jsonify({
            'success': True,
            'message': 'Test user exists',
            'user_found': True,
            'db_password': user.PasswordHash,
            'expected_password': 'sara123',
            'match': str(user.PasswordHash) == 'sara123'
        })
    else:
        return jsonify({
            'success': False,
            'message': 'Test user not found'
        })

# Registration (simple version)
@auth_bp.route('/register', methods=['POST'])
def customer_register():
    try:
        data = request.json
        name = data.get('name')
        email = data.get('email')
        phone = data.get('phone')
        password = data.get('password')
        address = data.get('address', '')
        
        if not all([name, email, phone, password]):
            return jsonify({'success': False, 'message': 'All fields required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute("SELECT Email FROM Users WHERE Email = ?", email)
        if cursor.fetchone():
            conn.close()
            return jsonify({'success': False, 'message': 'Email already exists'}), 400
        
        # Insert new user
        cursor.execute("""
            INSERT INTO Users (Name, Email, Phone, PasswordHash)
            VALUES (?, ?, ?, ?)
        """, name, email, phone, password)
        
        conn.commit()
        
        # Get the new user
        cursor.execute("SELECT User_ID, Name, Email, Phone, CreatedAt FROM Users WHERE Email = ?", email)
        new_user = cursor.fetchone()
        
        conn.close()
        
        if new_user:
            token = create_simple_token(new_user.User_ID, 'customer')
            
            return jsonify({
                'success': True,
                'message': 'Registration successful',
                'user': {
                    'id': new_user.User_ID,
                    'name': new_user.Name,
                    'email': new_user.Email,
                    'phone': new_user.Phone,
                    'created_at': new_user.CreatedAt.isoformat() if new_user.CreatedAt else None
                },
                'token': token
            })
        
        return jsonify({'success': False, 'message': 'Registration failed'}), 500
        
    except Exception as e:
        print(f"REGISTER ERROR: {str(e)}")
        return jsonify({'success': False, 'message': 'Registration error'}), 500

# Staff Login
@auth_bp.route('/staff/login', methods=['POST'])
def staff_login():
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT Staff_ID, Username, Name, Role, PasswordHash 
            FROM Staff 
            WHERE Username = ?
        """, username)
        
        staff = cursor.fetchone()
        conn.close()
        
        if staff and str(staff.PasswordHash) == str(password):
            token = create_simple_token(staff.Staff_ID, 'staff')
            
            return jsonify({
                'success': True,
                'message': 'Staff login successful',
                'staff': {
                    'id': staff.Staff_ID,
                    'username': staff.Username,
                    'name': staff.Name,
                    'role': staff.Role
                },
                'token': token
            })
        
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
        
    except Exception as e:
        print(f"STAFF LOGIN ERROR: {str(e)}")
        return jsonify({'success': False, 'message': 'Login error'}), 500