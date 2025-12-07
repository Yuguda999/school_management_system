"""
Text-to-Action Service
Orchestrates the text-to-action functionality for natural language database queries
"""
import logging
import re
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.school import School
from app.services.sql_generator_service import get_sql_generator_service
from app.services.sql_executor_service import get_sql_executor_service
from app.services.ai_service_factory import get_ai_service
from app.schemas.text_to_action import TextToActionResult

logger = logging.getLogger(__name__)


# Keywords that suggest a data query vs general support question
DATA_QUERY_KEYWORDS = [
    # Counting/aggregation keywords
    r'\bhow many\b',
    r'\bcount\b',
    r'\btotal\b',
    r'\baverage\b',
    r'\bsum\b',
    r'\bmaximum\b',
    r'\bminimum\b',
    r'\bhighest\b',
    r'\blowest\b',
    r'\btop\b',
    r'\bbottom\b',
    # Action keywords
    r'\blist\b',
    r'\bshow\b',
    r'\bget\b',
    r'\bfind\b',
    r'\bgive me\b',
    r'\btell me\b',
    r'\bdisplay\b',
    r'\bfetch\b',
    # Question patterns
    r'\bwhat is the\b',
    r'\bwhat are\b',
    r'\bwho are\b',
    r'\bwho is\b',
    r'\bwhich\b',
    r'\bwhere are\b',
    r'\bhow much\b',
    # Entity-specific patterns
    r'\bstudents?\b',
    r'\bteachers?\b',
    r'\bstaff\b',
    r'\bclasses?\b',
    r'\bgrades?\b',
    r'\bsubjects?\b',
    r'\battendance\b',
    r'\bexams?\b',
    # Financial keywords
    r'\bfees?\b',
    r'\bpayments?\b',
    r'\bpaid\b',
    r'\bunpaid\b',
    r'\bowed\b',
    r'\bowing\b',
    r'\boutstanding\b',
    r'\brevenue\b',
    r'\bincome\b',
    r'\bmoney\b',
    r'\bfinancial\b',
    r'\bfinance\b',
    r'\bcollected\b',
    r'\bcollection\b',
    r'\bbalance\b',
    r'\bdebt\b',
    # Academic patterns
    r'\benrollment\b',
    r'\bperformance\b',
    r'\bresults?\b',
    r'\breport\b',
    r'\bscore\b',
    # Contact/personal info
    r'\baddress\b',
    r'\bphone\b',
    r'\bemail\b',
    r'\bcontact\b',
    r'\bnames?\b',
    r'\bdetails?\b',
    r'\binfo\b',
    r'\binformation\b',
    # "All my" pattern
    r'\ball my\b',
    r'\ball the\b',
    r'\bevery\b',
    r'\beach\b',
]

# Keywords that suggest a general support question (not data)
SUPPORT_QUESTION_KEYWORDS = [
    r'\bhow do i\b',
    r'\bhow to\b',
    r'\bhow can i\b',
    r'\bcan you help me with\b',
    r'\bwhat does .+ mean\b',
    r'\bexplain .+ to me\b',
    r'\bwhy is .+ not working\b',
    r'\bproblem with\b',
    r'\bissue with\b',
    r'\berror\b',
    r'\bnot working\b',
    r'\bhelp me .+ setup\b',
    r'\bguide me\b',
    r'\btutorial\b',
    r'\bsteps to\b',
    r'\bwhere is the .+ button\b',
    r'\bwhere can i find\b',
]


class TextToActionService:
    """Service to orchestrate text-to-action queries"""
    
    def __init__(self):
        self.sql_generator = get_sql_generator_service()
        self.sql_executor = get_sql_executor_service()
        self.ai_service = get_ai_service()
    
    async def is_feature_enabled(self, db: AsyncSession, school_id: str) -> bool:
        """Check if text-to-action is enabled for the school"""
        try:
            result = await db.execute(
                select(School).where(
                    School.id == school_id,
                    School.is_deleted == False
                )
            )
            school = result.scalar_one_or_none()
            
            if not school:
                return False
            
            # Check settings JSON for text_to_action_enabled
            if school.settings and isinstance(school.settings, dict):
                return school.settings.get("text_to_action_enabled", False)
            
            return False
            
        except Exception as e:
            logger.error(f"Error checking text-to-action feature status: {str(e)}")
            return False
    
    def is_data_query(self, message: str) -> bool:
        """
        Determine if a message is a data query or a general support question
        
        Args:
            message: The user's message
            
        Returns:
            True if this appears to be a data query, False otherwise
        """
        message_lower = message.lower()
        
        # First check if it's clearly a support question
        for pattern in SUPPORT_QUESTION_KEYWORDS:
            if re.search(pattern, message_lower):
                # If it's a "how do I" type question, it's not a data query
                return False
        
        # Check for data query keywords
        for pattern in DATA_QUERY_KEYWORDS:
            if re.search(pattern, message_lower):
                return True
        
        return False
    
    async def process_query(
        self,
        message: str,
        school_id: str,
        user_id: str,
        user_role: str,
        db: AsyncSession
    ) -> TextToActionResult:
        """
        Process a natural language query and return results
        
        Args:
            message: The natural language query from the user
            school_id: The school ID for data isolation
            user_id: The user making the query
            user_role: The role of the user
            db: Database session
            
        Returns:
            TextToActionResult with the query results
        """
        try:
            # Check if the feature is enabled
            if not await self.is_feature_enabled(db, school_id):
                return TextToActionResult(
                    success=False,
                    query_type="general",
                    natural_language_answer="The data query feature is not enabled for your school. Please contact your school administrator to enable this feature.",
                    error="Feature not enabled"
                )
            
            # Check if this is a data query
            if not self.is_data_query(message):
                return TextToActionResult(
                    success=False,
                    query_type="general",
                    natural_language_answer="",
                    error="Not a data query - should be handled by regular support"
                )
            
            # Generate SQL from natural language
            sql_result = await self.sql_generator.generate_sql(
                natural_language_query=message,
                school_id=school_id,
                user_role=user_role,
                user_id=user_id
            )
            
            if not sql_result.success:
                return TextToActionResult(
                    success=False,
                    query_type="general",
                    natural_language_answer=f"I couldn't understand that query. {sql_result.error or 'Please try rephrasing your question.'}",
                    error=sql_result.error
                )
            
            if not sql_result.is_safe:
                return TextToActionResult(
                    success=False,
                    query_type="general",
                    natural_language_answer="I'm sorry, but I cannot process that query as it contains elements that aren't allowed for security reasons. Please try a different question.",
                    error=sql_result.error
                )
            
            # Execute the SQL query
            execution_result = await self.sql_executor.execute_query(
                db=db,
                sql=sql_result.sql
            )
            
            if not execution_result.success:
                return TextToActionResult(
                    success=False,
                    query_type=sql_result.query_type,
                    natural_language_answer=f"I encountered an error while fetching the data. Please try again or rephrase your question.",
                    error=execution_result.error,
                    generated_sql=sql_result.sql
                )
            
            # Format results for AI response generation
            formatted_results = self.sql_executor.format_results_for_ai(
                result=execution_result,
                original_query=message,
                query_type=sql_result.query_type
            )
            
            # Get school currency for financial queries
            currency = await self._get_school_currency(db, school_id)
            
            # Generate natural language response
            natural_response = await self._generate_natural_response(
                original_query=message,
                results=formatted_results,
                query_type=sql_result.query_type,
                row_count=execution_result.row_count,
                currency=currency
            )
            
            # Format data as markdown table if applicable
            if execution_result.row_count > 1 and sql_result.query_type in ("list", "grouped"):
                markdown_table = self.sql_executor.format_results_as_markdown_table(
                    result=execution_result,
                    max_display_rows=20
                )
                if markdown_table:
                    natural_response += "\n\n" + markdown_table
            
            return TextToActionResult(
                success=True,
                query_type=sql_result.query_type,
                natural_language_answer=natural_response,
                data=execution_result.data,
                row_count=execution_result.row_count,
                generated_sql=sql_result.sql  # Include for debugging/transparency
            )
            
        except Exception as e:
            logger.error(f"Error processing text-to-action query: {str(e)}")
            return TextToActionResult(
                success=False,
                query_type="general",
                natural_language_answer="I'm sorry, I encountered an unexpected error while processing your query. Please try again.",
                error=str(e)
            )
    
    async def _get_school_currency(self, db: AsyncSession, school_id: str) -> str:
        """Get the currency setting for a school"""
        try:
            result = await db.execute(
                select(School).where(
                    School.id == school_id,
                    School.is_deleted == False
                )
            )
            school = result.scalar_one_or_none()
            
            if school and school.settings and isinstance(school.settings, dict):
                return school.settings.get("currency", "NGN")
            
            return "NGN"  # Default to Nigerian Naira
            
        except Exception as e:
            logger.error(f"Error getting school currency: {str(e)}")
            return "NGN"
    
    async def _generate_natural_response(
        self,
        original_query: str,
        results: str,
        query_type: str,
        row_count: int,
        currency: str = "NGN"
    ) -> str:
        """Generate a natural language response from the query results"""
        try:
            # Currency formatting instructions
            currency_instruction = ""
            if any(word in original_query.lower() for word in ['revenue', 'payment', 'fee', 'money', 'amount', 'paid', 'collected', 'financial', 'income']):
                currency_instruction = f"""
IMPORTANT: For all monetary values, use the currency symbol/code: {currency}
Format examples for {currency}: 
- If NGN: ₦1,500,000 or NGN 1,500,000
- If USD: $1,500 or USD 1,500
- If GBP: £1,500 or GBP 1,500
"""
            
            prompt = f"""You are a helpful data assistant for a School Management System.
The user asked: "{original_query}"

Here are the ACTUAL database query results:
{results}

CRITICAL INSTRUCTIONS:
1. ONLY use the data shown above. Do NOT make up or invent any information.
2. If the results show no data or empty results, say "No data found" or similar.
3. If row_count is 0, clearly state that no records were found.
4. Generate a natural, conversational response that directly answers the user's question.
5. Be concise but informative. Use numbers and specific data from the results.
6. If showing counts, state them clearly. If showing lists, summarize them appropriately.
7. Do NOT say things like "Based on the query results" or "The database shows" - just answer naturally.
8. Do NOT include any SQL or technical details.
9. Format numbers nicely (e.g., use commas for thousands).
10. If no results were returned, be honest and say the data wasn't found.
{currency_instruction}

Number of rows returned: {row_count}
"""
            
            # Generate response using AI
            full_response = ""
            async for chunk in self.ai_service.generate_support_chat_stream(
                message=prompt,
                history=[],
                user_role="system",
                context="Natural Language Response Generation"
            ):
                full_response += chunk
            
            return full_response.strip()
            
        except Exception as e:
            logger.error(f"Error generating natural response: {str(e)}")
            # Fall back to basic response
            if query_type == "count" and row_count == 1:
                return results
            elif row_count == 0:
                return "No data found for your query."
            else:
                return f"Here are the results for your query:\n\n{results}"


# Singleton instance
_text_to_action_service = None


def get_text_to_action_service() -> TextToActionService:
    """Get or create text-to-action service instance"""
    global _text_to_action_service
    if _text_to_action_service is None:
        _text_to_action_service = TextToActionService()
    return _text_to_action_service
