import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()

def send_email(to_email, subject, html_body):
    """Envia email usando SMTP do Hostinger"""
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = os.getenv('SMTP_EMAIL')
        msg['To'] = to_email
        
        html_part = MIMEText(html_body, 'html')
        msg.attach(html_part)
        
        with smtplib.SMTP_SSL(
            os.getenv('SMTP_HOST'),
            int(os.getenv('SMTP_PORT', 465))
        ) as server:
            server.login(
                os.getenv('SMTP_USER'),
                os.getenv('SMTP_PASSWORD')
            )
            server.send_message(msg)
            
        return True
    except Exception as e:
        print(f"Erro ao enviar email: {str(e)}")
        return False