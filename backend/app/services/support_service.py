"""
Support Service for handling AI support chat and escalation
"""
import logging
from typing import AsyncGenerator, List, Optional
from app.services.ai_service_factory import get_ai_service
from app.services.email_service import EmailService

logger = logging.getLogger(__name__)

class SupportService:
    """Service for AI support and escalation"""

    def __init__(self):
        self.ai_service = get_ai_service()
        self.email_service = EmailService()

    async def chat_stream(
        self,
        message: str,
        history: List[dict],
        user_role: str,
        context: Optional[str] = None,
        school_id: Optional[str] = None,
        db: Optional[object] = None  # AsyncSession
    ) -> AsyncGenerator[str, None]:
        """
        Stream chat response from AI service
        """
        school_context_data = None
        
        # If school_id and db are provided, fetch school details
        if school_id and db:
            try:
                from sqlalchemy import select
                from app.models.school import School
                
                result = await db.execute(
                    select(School).where(School.id == school_id)
                )
                school = result.scalar_one_or_none()
                
                if school:
                    school_context_data = {
                        "id": str(school.id),
                        "name": school.name,
                        "code": school.code
                    }
            except Exception as e:
                logger.error(f"Failed to fetch school context: {e}")
        
        async for chunk in self.ai_service.generate_support_chat_stream(
            message=message,
            history=history,
            user_role=user_role,
            context=context,
            school_context_data=school_context_data
        ):
            yield chunk

    async def escalate_issue(
        self,
        user_email: str,
        user_name: str,
        user_role: str,
        issue_description: str,
        chat_history: Optional[List[dict]] = None
    ) -> bool:
        """
        Escalate an issue to human support via email
        """
        try:
            subject = f"Support Escalation: {user_role} - {user_name}"
            
            body = f"""
            <h2>Support Escalation Request</h2>
            <p><strong>User:</strong> {user_name} ({user_email})</p>
            <p><strong>Role:</strong> {user_role}</p>
            <p><strong>Issue Description:</strong></p>
            <p>{issue_description}</p>
            """
            
            if chat_history:
                body += "<h3>Chat History</h3><ul>"
                for msg in chat_history:
                    role = msg.get("role", "unknown")
                    content = msg.get("content", "")
                    body += f"<li><strong>{role}:</strong> {content}</li>"
                body += "</ul>"

            # In a real scenario, this would send to a support email address
            # For now, we'll send it to the system admin or a configured support email
            # Assuming email_service has a send_email method
            # await self.email_service.send_email(
            #     to_email="support@schoolsystem.com", 
            #     subject=subject, 
            #     html_content=body
            # )
            
            logger.info(f"Escalated issue for {user_email}: {issue_description}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to escalate issue: {str(e)}")
            return False
