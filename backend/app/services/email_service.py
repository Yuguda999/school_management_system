import logging
from typing import List, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails using Resend API (HTTP-based, works on Render.com)"""
    
    @staticmethod
    async def send_email(
        to_emails: List[str],
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        from_email: Optional[str] = None
    ) -> bool:
        """
        Send email using Resend API (HTTP-based, bypasses SMTP port restrictions)

        Args:
            to_emails: List of recipient email addresses
            subject: Email subject
            html_content: HTML content of the email
            text_content: Plain text content (optional)
            from_email: Sender email (optional, uses default from settings)

        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            # Check if Resend API key is configured
            if settings.resend_api_key:
                return await EmailService._send_via_resend(
                    to_emails=to_emails,
                    subject=subject,
                    html_content=html_content,
                    text_content=text_content,
                    from_email=from_email
                )
            else:
                # Fall back to SMTP if Resend is not configured
                return await EmailService._send_via_smtp(
                    to_emails=to_emails,
                    subject=subject,
                    html_content=html_content,
                    text_content=text_content,
                    from_email=from_email
                )
                
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            logger.error(f"Exception type: {type(e).__name__}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return False
    
    @staticmethod
    async def _send_via_resend(
        to_emails: List[str],
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        from_email: Optional[str] = None
    ) -> bool:
        """Send email using Resend HTTP API"""
        try:
            import resend
            
            logger.info(f"Attempting to send email via Resend to {to_emails}")
            
            resend.api_key = settings.resend_api_key
            
            # Use verified domain campuspq.com for sending emails
            sender = "Edix School Platform <noreply@campuspq.com>"
            
            logger.info(f"Sending email from: {sender}")
            
            params = {
                "from": sender,
                "to": to_emails,
                "subject": subject,
                "html": html_content,
            }
            
            if text_content:
                params["text"] = text_content
            
            email_response = resend.Emails.send(params)
            
            logger.info(f"Email sent successfully via Resend to {', '.join(to_emails)}")
            logger.info(f"Resend response: {email_response}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email via Resend: {str(e)}")
            logger.error(f"Exception type: {type(e).__name__}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return False
    
    @staticmethod
    async def _send_via_smtp(
        to_emails: List[str],
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        from_email: Optional[str] = None
    ) -> bool:
        """Send email using SMTP (fallback for local development)"""
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            
            logger.info(f"Attempting to send email via SMTP to {to_emails}")
            logger.info(f"SMTP settings - Host: {settings.smtp_host}, Port: {settings.smtp_port}, User: {settings.smtp_user}")

            if not settings.smtp_user or not settings.smtp_password:
                logger.warning("SMTP credentials not configured. Email not sent.")
                return False
            
            from_email = from_email or settings.emails_from_email
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = from_email
            msg['To'] = ', '.join(to_emails)
            
            # Add text content if provided
            if text_content:
                text_part = MIMEText(text_content, 'plain')
                msg.attach(text_part)
            
            # Add HTML content
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            # Connect to SMTP server and send email
            logger.info(f"Connecting to SMTP server {settings.smtp_host}:{settings.smtp_port}")
            logger.info(f"Using SSL: {settings.smtp_ssl}, Using TLS: {settings.smtp_tls}")

            if settings.smtp_ssl:
                server = smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port)
                logger.info("Connected using SSL")
            else:
                server = smtplib.SMTP(settings.smtp_host, settings.smtp_port)
                logger.info("Connected using regular SMTP")
                if settings.smtp_tls:
                    logger.info("Starting TLS")
                    server.starttls()

            logger.info(f"Logging in with user: {settings.smtp_user}")
            server.login(settings.smtp_user, settings.smtp_password)
            logger.info("Login successful, sending message")
            server.send_message(msg)
            logger.info("Message sent, closing connection")
            server.quit()

            logger.info(f"Email sent successfully via SMTP to {', '.join(to_emails)}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email via SMTP: {str(e)}")
            logger.error(f"Exception type: {type(e).__name__}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return False
    
    @staticmethod
    def generate_teacher_invitation_email(
        teacher_name: str,
        school_name: str,
        invitation_link: str,
        invited_by_name: str,
        expires_hours: int = 72
    ) -> tuple[str, str]:
        """
        Generate teacher invitation email content
        
        Returns:
            tuple: (html_content, text_content)
        """
        subject = f"Invitation to Join {school_name} as a Teacher"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Teacher Invitation</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
                .button {{ display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
                .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }}
                .warning {{ background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to {school_name}!</h1>
                </div>
                <div class="content">
                    <h2>Hello {teacher_name},</h2>
                    
                    <p>You have been invited by <strong>{invited_by_name}</strong> to join <strong>{school_name}</strong> as a teacher.</p>
                    
                    <p>To complete your registration and set up your account, please click the button below:</p>
                    
                    <div style="text-align: center;">
                        <a href="{invitation_link}" class="button">Accept Invitation & Set Password</a>
                    </div>
                    
                    <div class="warning">
                        <strong>⚠️ Important:</strong> This invitation link will expire in {expires_hours} hours. Please complete your registration before then.
                    </div>
                    
                    <p>If you're unable to click the button above, you can copy and paste the following link into your browser:</p>
                    <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace;">
                        {invitation_link}
                    </p>
                    
                    <p>Once you've set up your account, you'll be able to:</p>
                    <ul>
                        <li>Access the teacher dashboard</li>
                        <li>Manage your classes and subjects</li>
                        <li>Communicate with students and parents</li>
                        <li>Track student progress and grades</li>
                    </ul>
                    
                    <p>If you have any questions or need assistance, please contact the school administration.</p>
                    
                    <p>We look forward to having you as part of our teaching team!</p>
                    
                    <p>Best regards,<br>
                    The {school_name} Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated message. Please do not reply to this email.</p>
                    <p>If you did not expect this invitation, please ignore this email.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Welcome to {school_name}!
        
        Hello {teacher_name},
        
        You have been invited by {invited_by_name} to join {school_name} as a teacher.
        
        To complete your registration and set up your account, please visit:
        {invitation_link}
        
        IMPORTANT: This invitation link will expire in {expires_hours} hours.
        
        Once you've set up your account, you'll be able to:
        - Access the teacher dashboard
        - Manage your classes and subjects
        - Communicate with students and parents
        - Track student progress and grades
        
        If you have any questions or need assistance, please contact the school administration.
        
        We look forward to having you as part of our teaching team!
        
        Best regards,
        The {school_name} Team
        
        ---
        This is an automated message. Please do not reply to this email.
        If you did not expect this invitation, please ignore this email.
        """
        
        return html_content, text_content
