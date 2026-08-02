# main.py
import sys
import os
import json
import webview
from api import InvoiceAPI


def resource_path(relative_path):
    """Get absolute path to resource, works for dev and PyInstaller"""
    try:
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")
    return os.path.join(base_path, relative_path)


def ensure_config():
    """Ensure config.json exists with defaults"""
    config_path = 'config.json'
    if not os.path.exists(config_path):
        default_config = {
            "company": {
                "name": "Your Business Name",
                "email": "yourbusiness@gmail.com",
                "phone": "(123) 456-7890"
            },
            "smtp": {
                "server": "smtp.gmail.com",
                "port": 587,
                "username": "",
                "password": "",
                "email_subject": "Invoice from {company}",
                "email_body": "Dear {name},\n\nPlease find your invoice attached.\n\nDue: {due_date}\nTotal: ${total}\n\nThank you for your business!"
            },
            "payment": {
                "bank_name": "",
                "account_name": "",
                "bsb": "",
                "account_number": "",
                "bpay_biller_code": "",
                "bpay_ref": ""
            }
        }
        with open(config_path, 'w') as f:
            json.dump(default_config, f, indent=2)
    return config_path


def main():
    # Ensure config exists
    ensure_config()

    # Ensure invoices directory exists
    if not os.path.exists('invoices'):
        os.makedirs('invoices')

    # Create API instance
    api = InvoiceAPI()

    # Get UI path
    ui_path = resource_path('ui/index.html')

    # Create window
    window = webview.create_window(
        'Invoice Generator v3',
        ui_path,
        js_api=api,
        width=1200,
        height=800,
        min_size=(800, 600),
        resizable=True
    )

    # Start the application
    webview.start(debug=False, private_mode=False)


if __name__ == '__main__':
    main()