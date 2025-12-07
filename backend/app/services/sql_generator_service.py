"""
SQL Generator Service for Text-to-Action feature
Uses AI to convert natural language queries to SQL
"""
import logging
import re
from typing import Tuple, List, Optional, Set
from app.services.ai_service_factory import get_ai_service
from app.services.schema_context_service import get_schema_context_service
from app.schemas.text_to_action import SQLGenerationResult

logger = logging.getLogger(__name__)


# Dangerous SQL patterns that should never be allowed
DANGEROUS_PATTERNS = [
    r'\bINSERT\b',
    r'\bUPDATE\b',
    r'\bDELETE\b',
    r'\bDROP\b',
    r'\bALTER\b',
    r'\bTRUNCATE\b',
    r'\bCREATE\b',
    r'\bREPLACE\b',
    r'\bGRANT\b',
    r'\bREVOKE\b',
    r'\bEXEC\b',
    r'\bEXECUTE\b',
    r'\bCALL\b',
    r'\bSET\b',
    r'\b--\b',  # SQL comments (potential injection)
    r'/\*',     # Block comments
    r'\bUNION\b.*\bSELECT\b',  # UNION-based injection
    r';\s*SELECT',  # Stacked queries
    r';\s*DROP',
    r';\s*DELETE',
    r'xp_',  # SQL Server extended stored procedures
    r'sp_',  # SQL Server stored procedures
]


class SQLGeneratorService:
    """Service to generate SQL from natural language using AI"""
    
    def __init__(self):
        self.ai_service = get_ai_service()
        self.schema_service = get_schema_context_service()
    
    async def generate_sql(
        self,
        natural_language_query: str,
        school_id: str,
        user_role: str,
        user_id: Optional[str] = None
    ) -> SQLGenerationResult:
        """
        Generate SQL from a natural language query
        
        Args:
            natural_language_query: The user's question in natural language
            school_id: The school ID for data isolation
            user_role: The role of the user making the query
            user_id: The user ID (for teacher-specific filtering)
            
        Returns:
            SQLGenerationResult with the generated SQL or error
        """
        try:
            # Get schema context for this user's role
            schema_context = self.schema_service.get_schema_context(user_role, school_id)
            allowed_tables = self.schema_service.get_allowed_tables(user_role)
            
            # Build the prompt for SQL generation
            prompt = self._build_sql_generation_prompt(
                natural_language_query,
                schema_context,
                school_id,
                user_role,
                allowed_tables
            )
            
            # Generate SQL using the AI service
            sql = await self._generate_sql_with_ai(prompt)
            
            if not sql:
                return SQLGenerationResult(
                    success=False,
                    error="Failed to generate SQL from the query"
                )
            
            # Clean up the SQL
            sql = self._clean_sql(sql)
            
            # Check if the AI returned explanatory text instead of SQL
            # This happens when the AI can't answer the question
            if not sql.upper().strip().startswith('SELECT'):
                # The AI returned an explanation, not SQL
                # Extract the explanation to return to the user
                logger.info(f"AI could not generate SQL, returned: {sql[:200]}...")
                return SQLGenerationResult(
                    success=False,
                    error=self._extract_ai_explanation(sql)
                )
            
            # Replace school_id placeholder with actual value
            sql = sql.replace("'{school_id}'", f"'{school_id}'")
            sql = sql.replace("{school_id}", school_id)
            
            # Fix any malformed/truncated school_ids - replace any UUID-like pattern 
            # in school_id context with the correct school_id
            sql = self._fix_school_id_in_sql(sql, school_id)
            
            # Validate SQL safety
            is_safe, safety_error = self.validate_sql_safety(sql, allowed_tables, school_id)
            
            if not is_safe:
                logger.warning(f"Unsafe SQL generated: {sql}. Error: {safety_error}")
                return SQLGenerationResult(
                    success=False,
                    sql=sql,
                    is_safe=False,
                    error=f"Generated query failed safety validation: {safety_error}"
                )
            
            # Determine query type
            query_type = self._determine_query_type(sql)
            
            return SQLGenerationResult(
                success=True,
                sql=sql,
                query_type=query_type,
                is_safe=True
            )
            
        except Exception as e:
            logger.error(f"Error generating SQL: {str(e)}")
            return SQLGenerationResult(
                success=False,
                error=f"Error generating SQL: {str(e)}"
            )
    
    def _fix_school_id_in_sql(self, sql: str, correct_school_id: str) -> str:
        """
        Fix any malformed or truncated school_id values in the SQL.
        The AI sometimes truncates or corrupts the UUID, so we need to fix it.
        """
        # Pattern to match school_id = 'some-uuid-like-value'
        # This catches both correct and malformed UUIDs
        pattern = r"school_id\s*=\s*'([a-f0-9\-]+)'"
        
        def replace_school_id(match):
            return f"school_id = '{correct_school_id}'"
        
        fixed_sql = re.sub(pattern, replace_school_id, sql, flags=re.IGNORECASE)
        
        # Also fix id = 'uuid' pattern for queries on the schools table
        # This is a more targeted fix - only for FROM schools ... WHERE id = '...'
        if re.search(r'FROM\s+schools\s+WHERE', fixed_sql, re.IGNORECASE):
            id_pattern = r"(\bFROM\s+schools\s+WHERE\s+)id\s*=\s*'([a-f0-9\-]+)'"
            fixed_sql = re.sub(
                id_pattern, 
                lambda m: f"{m.group(1)}id = '{correct_school_id}'",
                fixed_sql, 
                flags=re.IGNORECASE
            )
        
        # Also fix common SQL syntax errors from AI generation
        fixed_sql = self._fix_common_sql_errors(fixed_sql)
        
        return fixed_sql
    
    def _fix_common_sql_errors(self, sql: str) -> str:
        """
        Fix common SQL syntax errors that AI sometimes generates.
        """
        # Fix "is_deleted false" -> "is_deleted = false"
        sql = re.sub(r'\bis_deleted\s+(true|false)\b', r'is_deleted = \1', sql, flags=re.IGNORECASE)
        
        # Fix "is_active false" -> "is_active = false"
        sql = re.sub(r'\bis_active\s+(true|false)\b', r'is_active = \1', sql, flags=re.IGNORECASE)
        
        # Fix "status 'VALUE'" -> "status = 'VALUE'"
        sql = re.sub(r"\bstatus\s+('[\w]+')", r"status = \1", sql, flags=re.IGNORECASE)
        
        # Fix double equals
        sql = re.sub(r'=\s*=', '=', sql)
        
        return sql
    
    def _extract_ai_explanation(self, response: str) -> str:
        """
        Extract a user-friendly message from the AI's explanatory response.
        This is called when the AI couldn't generate SQL and returned text instead.
        """
        # Clean up the response
        response = response.strip()
        
        # If it's a reasonable length, return it as-is
        if len(response) < 300:
            return response
        
        # Otherwise, try to extract the key message
        # Look for common patterns
        if "I'm sorry" in response or "I cannot" in response or "I can't" in response:
            # Find the first sentence
            sentences = re.split(r'[.!?]', response)
            if sentences:
                return sentences[0].strip() + "."
        
        # Default: truncate and add ellipsis
        return response[:200] + "..."
    
    def _build_sql_generation_prompt(
        self,
        query: str,
        schema_context: str,
        school_id: str,
        user_role: str,
        allowed_tables: Set[str]
    ) -> str:
        """Build the prompt for SQL generation"""
        
        tables_list = ", ".join(sorted(allowed_tables))
        
        prompt = f"""You are an expert SQL query generator for a School Management System.
Convert the following natural language query to a PostgreSQL-compatible SELECT query.

{schema_context}

## STRICT RULES:
1. Generate ONLY a single SELECT statement
2. ALWAYS include `school_id = '{school_id}'` in the WHERE clause
3. ALWAYS include `is_deleted = false` for tables with soft-delete
4. Only use these tables: {tables_list}
5. Do NOT use INSERT, UPDATE, DELETE, DROP, or any data modification statements
6. Do NOT use UNION with additional SELECT statements
7. Use proper JOINs for related data
8. Limit results to 100 rows maximum using LIMIT 100
9. Return ONLY the SQL query, no explanations or markdown formatting
10. For counting queries, use COUNT(*) with a clear alias like 'total' or 'count'

## USER QUERY:
{query}

## SQL QUERY:
"""
        return prompt
    
    async def _generate_sql_with_ai(self, prompt: str) -> Optional[str]:
        """Use AI to generate SQL from the prompt"""
        try:
            # Use the AI service to generate SQL
            # We'll use a non-streaming call for SQL generation
            full_response = ""
            
            async for chunk in self.ai_service.generate_support_chat_stream(
                message=prompt,
                history=[],
                user_role="system",
                context="SQL Generation"
            ):
                full_response += chunk
            
            return full_response.strip()
            
        except Exception as e:
            logger.error(f"AI SQL generation failed: {str(e)}")
            return None
    
    def _clean_sql(self, sql: str) -> str:
        """Clean up the generated SQL"""
        # Remove markdown code blocks if present
        sql = re.sub(r'^```sql\s*', '', sql, flags=re.IGNORECASE)
        sql = re.sub(r'^```\s*', '', sql)
        sql = re.sub(r'\s*```$', '', sql)
        
        # Remove leading/trailing whitespace
        sql = sql.strip()
        
        # Remove trailing semicolon (we'll add it during execution if needed)
        sql = sql.rstrip(';')
        
        # Remove any explanatory text before or after the SQL
        # Look for the SELECT statement
        match = re.search(r'(SELECT\s+.+)', sql, re.IGNORECASE | re.DOTALL)
        if match:
            sql = match.group(1)
        
        return sql.strip()
    
    def validate_sql_safety(
        self,
        sql: str,
        allowed_tables: Set[str],
        school_id: str
    ) -> Tuple[bool, str]:
        """
        Validate that the SQL query is safe to execute
        
        Returns:
            Tuple of (is_safe, error_message)
        """
        sql_upper = sql.upper()
        
        # Check for dangerous patterns
        for pattern in DANGEROUS_PATTERNS:
            if re.search(pattern, sql, re.IGNORECASE):
                return False, f"Query contains forbidden pattern"
        
        # Must start with SELECT
        if not sql_upper.strip().startswith('SELECT'):
            return False, "Query must be a SELECT statement"
        
        # Check for multiple statements (semicolon followed by another statement)
        if re.search(r';\s*\w', sql):
            return False, "Multiple statements are not allowed"
        
        # Verify school_id is present in the query (check for the pattern, not exact match)
        # For most tables, we check for school_id = 'uuid'
        # For the schools table itself, we check for id = 'uuid' (since it's the primary key)
        has_school_id_filter = re.search(r'school_id\s*=\s*\'[a-f0-9\-]+\'', sql, re.IGNORECASE)
        has_schools_id_filter = re.search(r'\bschools\b.*\bid\s*=\s*\'[a-f0-9\-]+\'', sql, re.IGNORECASE | re.DOTALL)
        # Also check for id = 'uuid' in FROM schools WHERE pattern
        has_schools_table_with_id = re.search(r'FROM\s+schools\s+WHERE\s+id\s*=\s*\'[a-f0-9\-]+\'', sql, re.IGNORECASE)
        
        if not (has_school_id_filter or has_schools_id_filter or has_schools_table_with_id):
            return False, "Query must include school_id filter"
        
        # Check for common SQL syntax errors from AI generation
        # e.g., "is_deleted false" instead of "is_deleted = false"
        syntax_error_patterns = [
            (r'\bis_deleted\s+(?:true|false)\b', "Missing '=' operator for is_deleted"),
            (r'\bis_active\s+(?:true|false)\b', "Missing '=' operator for is_active"),
            (r'\bstatus\s+\'[A-Z]+\'', "Missing '=' operator for status"),
            (r'=\s*=', "Double equals sign"),
        ]
        
        for pattern, error_msg in syntax_error_patterns:
            if re.search(pattern, sql, re.IGNORECASE):
                return False, f"SQL syntax error: {error_msg}"
        
        # Check that only allowed tables are referenced
        # Extract table names from FROM and JOIN clauses
        tables_in_query = self._extract_table_names(sql)
        
        for table in tables_in_query:
            if table.lower() not in {t.lower() for t in allowed_tables}:
                return False, f"Access to table '{table}' is not permitted for your role"
        
        # Check for subqueries that might bypass restrictions
        subquery_count = sql_upper.count('SELECT')
        if subquery_count > 3:  # Allow some subqueries but limit them
            return False, "Too many nested queries"
        
        return True, ""
    
    def _extract_table_names(self, sql: str) -> List[str]:
        """Extract table names from SQL query"""
        tables = []
        
        # Match table names after FROM
        from_matches = re.findall(r'\bFROM\s+(\w+)', sql, re.IGNORECASE)
        tables.extend(from_matches)
        
        # Match table names after JOIN
        join_matches = re.findall(r'\bJOIN\s+(\w+)', sql, re.IGNORECASE)
        tables.extend(join_matches)
        
        # Remove duplicates and return
        return list(set(tables))
    
    def _determine_query_type(self, sql: str) -> str:
        """Determine the type of query based on SQL structure"""
        sql_upper = sql.upper()
        
        if 'COUNT(' in sql_upper and 'GROUP BY' not in sql_upper:
            return "count"
        elif 'SUM(' in sql_upper or 'AVG(' in sql_upper or 'MAX(' in sql_upper or 'MIN(' in sql_upper:
            return "aggregate"
        elif 'GROUP BY' in sql_upper:
            return "grouped"
        else:
            return "list"


# Singleton instance
_sql_generator_service = None


def get_sql_generator_service() -> SQLGeneratorService:
    """Get or create SQL generator service instance"""
    global _sql_generator_service
    if _sql_generator_service is None:
        _sql_generator_service = SQLGeneratorService()
    return _sql_generator_service
