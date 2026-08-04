# app.py - Flask server for development
from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS
from api import InvoiceAPI
import json
import os

app = Flask(__name__, static_folder='ui')
CORS(app)
api = InvoiceAPI()

@app.route('/')
def index():
    return send_from_directory('ui', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('ui', path)

@app.route('/api/generate_invoice', methods=['POST'])
def generate_invoice():
    data = request.json
    result = api.generate_invoice(data)
    return jsonify(result)

@app.route('/api/send_email', methods=['POST'])
def send_email():
    data = request.json
    result = api.send_email(data['pdf_path'], data['invoice_data'])
    return jsonify(result)

@app.route('/api/get_config', methods=['GET'])
def get_config():
    return jsonify(api.get_config())

@app.route('/api/save_config', methods=['POST'])
def save_config():
    data = request.json
    result = api.save_config(data)
    return jsonify(result)

if __name__ == '__main__':
    print("""
    ╔═══════════════════════════════════════════════════╗
    ║   Invoice Generator v3 - Development Server       ║
    ║                                                   ║
    ║   Open in browser: http://localhost:8090          ║
    ║                                                   ║
    ║   Press CTRL+C to stop                            ║
    ╚═══════════════════════════════════════════════════╝
    """)
    app.run(host='localhost', port=8090, debug=True)