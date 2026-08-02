# core/emailer.py
import smtplib
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication


class EmailSender:
    def __init__(self, smtp_config):
        self.smtp_config = smtp_config

    def send_invoice(self, to_email, pdf_path, data):
        """Send invoice via email"""
        try:
            msg = MIMEMultipart()
            msg['From'] = self.smtp_config['username']
            msg['To'] = to_email

            # Format subject with placeholders
            subject = self.smtp_config['email_subject'].format(**data)
            msg['Subject'] = subject

            # Format body with placeholders
            body = self.smtp_config['email_body'].format(**data)
            msg.attach(MIMEText(body))

            # Attach PDF
            with open(pdf_path, 'rb') as f:
                attachment = MIMEApplication(f.read(), _subtype='pdf')
                attachment.add_header(
                    'Content-Disposition',
                    'attachment',
                    filename=os.path.basename(pdf_path)
                )
                msg.attach(attachment)

            # Send email
            with smtplib.SMTP(self.smtp_config['server'], int(self.smtp_config['port'])) as server:
                server.starttls()
                server.login(
                    self.smtp_config['username'],
                    self.smtp_config['password']
                )
                server.send_message(msg)

            return True, None
        except Exception as e:
            return False, str(e)