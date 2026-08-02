# core/pdf_gen.py
import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import Paragraph, Table, TableStyle
from reportlab.lib.units import inch
from reportlab.lib.utils import ImageReader


class PDFGenerator:
    def __init__(self, config):
        self.config = config
        self.company_name = config['company']['name']
        self.company_email = config['company']['email']
        self.company_phone = config['company']['phone']

    def create_invoice(self, customer_details, payment_details, due_date, items):
        """Generate professional invoice with payment options"""
        # Ensure invoices directory exists
        if not os.path.exists('invoices'):
            os.makedirs('invoices')

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"invoices/Invoice_{timestamp}_{customer_details['name'].replace(' ', '_')}.pdf"

        c = canvas.Canvas(filename, pagesize=letter)
        width, height = letter

        # ===== HEADER =====
        c.setFont("Helvetica-Bold", 18)
        c.setFillColor(colors.darkblue)
        c.drawCentredString(width / 2, height - 50, "INVOICE")
        c.line(100, height - 60, width - 100, height - 60)

        # ===== COMPANY INFO =====
        c.setFont("Helvetica", 10)
        c.drawString(100, height - 90, self.company_name)
        c.drawString(100, height - 105, "Email: " + self.company_email)
        c.drawString(100, height - 120, "Phone: " + self.company_phone)

        # ===== CUSTOMER INFO =====
        c.setFont("Helvetica-Bold", 12)
        c.drawString(100, height - 170, "BILL TO:")
        c.setFont("Helvetica", 10)

        customer_info = [
            ["Name:", customer_details['name']],
            ["Address:", customer_details['address']],
            ["City:", f"{customer_details['city']}, {customer_details['state']} {customer_details['postcode']}"],
            ["Phone:", customer_details['phone']],
            ["Email:", customer_details['email']]
        ]

        table = Table(customer_info, colWidths=[1.5 * inch, 4 * inch])
        table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        table.wrapOn(c, width, height)
        table.drawOn(c, 100, height - 260)

        # ===== INVOICE DETAILS =====
        c.setFont("Helvetica-Bold", 12)
        c.drawString(350, height - 170, "INVOICE DETAILS")
        c.setFont("Helvetica", 10)
        c.drawString(350, height - 190, f"Invoice #: INV-{timestamp}")
        c.drawString(350, height - 205, f"Date: {datetime.now().strftime('%Y-%m-%d')}")
        c.drawString(350, height - 220, f"Due: {due_date.strftime('%Y-%m-%d')}")

        # ===== ITEMS TABLE =====
        c.setFont("Helvetica-Bold", 12)
        c.drawString(100, height - 280, "ITEM DESCRIPTION")
        c.drawString(450, height - 280, "AMOUNT")
        c.line(100, height - 285, width - 100, height - 285)

        c.setFont("Helvetica", 10)
        y_position = height - 305
        subtotal = 0

        for item in items:
            c.drawString(100, y_position, item['name'])
            c.drawString(450, y_position, f"${item['price']:.2f}")
            subtotal += item['price']
            y_position -= 20

        c.line(100, y_position, width - 100, y_position)

        # ===== TOTAL =====
        c.setFont("Helvetica-Bold", 14)
        c.drawString(350, y_position - 40, "TOTAL:")
        c.drawString(450, y_position - 40, f"${subtotal:.2f}")
        c.line(350, y_position - 45, width - 100, y_position - 45)

        # ===== PAYMENT DETAILS =====
        payment_y = y_position - 100

        # Bank Transfer Details
        c.setFont("Helvetica-Bold", 12)
        c.drawString(100, payment_y, "PAYMENT OPTIONS")
        c.setFont("Helvetica", 10)

        c.drawString(100, payment_y - 20, "Bank Transfer:")
        c.drawString(120, payment_y - 35, f"Bank: {payment_details['bank_name']}")
        c.drawString(120, payment_y - 50, f"Account Name: {payment_details['account_name']}")
        c.drawString(120, payment_y - 65, f"BSB: {payment_details['bsb']}")
        c.drawString(120, payment_y - 80, f"Account #: {payment_details['account_number']}")

        # BPay Details
        if payment_details.get('bpay_biller_code'):
            c.drawString(100, payment_y - 110, "BPay Payment:")
            c.drawString(120, payment_y - 125, f"Biller Code: {payment_details['bpay_biller_code']}")
            c.drawString(120, payment_y - 140, f"Reference: {payment_details['bpay_ref']}")

            logo_path = "assets/bpay_logo.png"
            if os.path.exists(logo_path):
                try:
                    logo = ImageReader(logo_path)
                    c.drawImage(logo, 350, payment_y - 160, width=100, height=50, preserveAspectRatio=True)
                except Exception as e:
                    self._draw_vector_bpay_logo(c, 350, payment_y - 140)
            else:
                self._draw_vector_bpay_logo(c, 350, payment_y - 140)

        # Payment Instructions
        c.setFont("Helvetica", 8)
        c.drawString(100, payment_y - 170, "Please include invoice number as payment reference")

        # ===== FOOTER =====
        c.setFont("Helvetica", 8)
        c.drawCentredString(width / 2, 40, "Thank you for your business!")
        c.drawCentredString(width / 2, 30, f"Questions? Email: {self.company_email}")

        c.save()
        return filename

    def _draw_vector_bpay_logo(self, c, x, y):
        """Fallback vector BPAY logo"""
        c.setFillColor(colors.black)
        c.setFont("Helvetica-Bold", 16)
        c.drawString(x, y, "BPAY")
        c.setFillColor(colors.darkblue)
        c.rect(x, y - 5, 50, 3, fill=1, stroke=0)
        c.setFillColor(colors.black)