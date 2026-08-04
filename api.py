# api.py
import os
import json
import subprocess
import sys
from datetime import datetime
import webview
from core.pdf_gen import PDFGenerator
from core.emailer import EmailSender


class InvoiceAPI:
    def __init__(self):
        self.config = self._load_config()

    def _load_config(self):
        try:
            with open('config.json', 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return self._create_default_config()

    def _create_default_config(self):
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
        with open('config.json', 'w') as f:
            json.dump(default_config, f, indent=2)
        return default_config

    def get_config(self):
        return self.config

    def save_config(self, config_data):
        try:
            if 'company' not in config_data:
                config_data['company'] = {}
            if 'smtp' not in config_data:
                config_data['smtp'] = {}
            if 'payment' not in config_data:
                config_data['payment'] = {}

            default_config = self._create_default_config()
            for section in ['company', 'smtp', 'payment']:
                for key in default_config[section]:
                    if key not in config_data[section]:
                        config_data[section][key] = default_config[section][key]

            with open('config.json', 'w') as f:
                json.dump(config_data, f, indent=2)

            self.config = config_data
            return {'success': True}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def generate_invoice(self, data):
        try:
            config = self.get_config()
            pdf_gen = PDFGenerator(config)

            due_date = datetime.strptime(data['due_date'], '%Y-%m-%d')

            # ✅ UPDATED: Pass invoice_name to pdf_gen
            pdf_path = pdf_gen.create_invoice(
                customer_details=data['customer'],
                payment_details=config['payment'],
                due_date=due_date,
                items=data['items'],
                invoice_name=data.get('invoice_name', '')  # ✅ NEW
            )

            # ✅ UPDATED: Use custom name in response too
            invoice_number = data.get('invoice_name', f"INV-{datetime.now().strftime('%Y%m%d_%H%M%S')}")

            return {
                'success': True,
                'path': pdf_path,
                'invoice_number': invoice_number
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def send_email(self, pdf_path, data):
        try:
            config = self.get_config()
            email_sender = EmailSender(config['smtp'])

            total = sum(item['price'] for item in data['items'])
            email_data = {
                'name': data['customer']['name'],
                'due_date': data['due_date'],
                'total': f"{total:.2f}",
                'company': config['company']['name']
            }

            success, error = email_sender.send_invoice(
                to_email=data['customer']['email'],
                pdf_path=pdf_path,
                data=email_data
            )

            if success:
                return {'success': True}
            else:
                return {'success': False, 'error': error}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def open_invoice_folder(self):
        try:
            invoice_path = os.path.abspath('invoices')
            if not os.path.exists(invoice_path):
                os.makedirs(invoice_path)

            if sys.platform == 'win32':
                os.startfile(invoice_path)
            elif sys.platform == 'darwin':
                subprocess.run(['open', invoice_path])
            else:
                subprocess.run(['xdg-open', invoice_path])
            return {'success': True}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def open_file(self, file_path):
        try:
            full_path = os.path.join('invoices', file_path)
            if not os.path.exists(full_path):
                return {'success': False, 'error': 'File not found'}

            if sys.platform == 'win32':
                os.startfile(full_path)
            elif sys.platform == 'darwin':
                subprocess.run(['open', full_path])
            else:
                subprocess.run(['xdg-open', full_path])
            return {'success': True}
        except Exception as e:
            return {'success': False, 'error': str(e)}