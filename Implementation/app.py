# app.py (في الـ root مع index.html)
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# Serve HTML files
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_file(filename):
    if filename.endswith('.html'):
        return send_from_directory('.', filename)
    elif filename.startswith('js/') or filename.startswith('style/') or filename.startswith('media/'):
        return send_from_directory('.', filename)
    return jsonify({'error': 'Not found'}), 404

# Basic API routes
@app.route('/api/')
def api_home():
    return jsonify({
        'message': 'API is running',
        'endpoints': ['/api/auth/login', '/api/auth/register']
    })

@app.route('/api/auth/login', methods=['POST'])
def login():
    return jsonify({'success': True, 'message': 'Login endpoint'})

@app.route('/api/auth/register', methods=['POST'])
def register():
    return jsonify({'success': True, 'message': 'Register endpoint'})

if __name__ == '__main__':
    print("🚀 Server: http://localhost:5000")
    print("📁 Static files from current directory")
    app.run(debug=True, port=5000)