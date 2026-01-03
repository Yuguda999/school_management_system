"""
Background Email Service

This module provides utilities for sending emails in the background
using FastAPI's BackgroundTasks to avoid blocking API responses.
"""

import asyncio
import logging
from typing import List, Optional

from app.services.email_service import EmailService

logger = logging.getLogger(__name__)


def send_email_background(
    to_emails: List[str],
    subject: str,
    html_content: str,
    text_content: Optional[str] = None,
    from_email: Optional[str] = None,
    sender_name: Optional[str] = None
):
    """
    Synchronous wrapper for sending emails in background tasks.
    
    This function wraps the async EmailService.send_email method so it can
    be used with FastAPI's BackgroundTasks.add_task() which expects a sync function.
    
    Args:
        to_emails: List of recipient email addresses
        subject: Email subject
        html_content: HTML content of the email
        text_content: Plain text content (optional)
        from_email: Sender email (optional, uses default from settings)
        sender_name: Display name for sender (optional)
    """
    try:
        # Create event loop for running async code in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(
                EmailService.send_email(
                    to_emails=to_emails,
                    subject=subject,
                    html_content=html_content,
                    text_content=text_content,
                    from_email=from_email,
                    sender_name=sender_name
                )
            )
            if result:
                logger.info(f"Background email sent successfully to {', '.join(to_emails)}")
            else:
                logger.warning(f"Background email failed for {', '.join(to_emails)}")
        finally:
            loop.close()
    except Exception as e:
        logger.error(f"Error sending background email: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
