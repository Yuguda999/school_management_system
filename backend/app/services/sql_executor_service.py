"""
SQL Executor Service for Text-to-Action feature
Safely executes read-only SQL queries
"""
import logging
from typing import List, Dict, Any
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.text_to_action import SQLExecutionResult

logger = logging.getLogger(__name__)


class SQLExecutorService:
    """Service to safely execute read-only SQL queries"""
    
    def __init__(self):
        self.max_rows = 100  # Maximum rows to return
    
    async def execute_query(
        self,
        db: AsyncSession,
        sql: str,
        max_rows: int = None
    ) -> SQLExecutionResult:
        """
        Execute a read-only SQL query
        
        Args:
            db: Database session
            sql: The SQL query to execute
            max_rows: Maximum number of rows to return
            
        Returns:
            SQLExecutionResult with the query results
        """
        if max_rows is None:
            max_rows = self.max_rows
        
        try:
            # Ensure the query has a LIMIT if it's a list query
            if 'LIMIT' not in sql.upper():
                sql = f"{sql} LIMIT {max_rows}"
            
            # Execute the query
            result = await db.execute(text(sql))
            
            # Get column names
            columns = list(result.keys())
            
            # Fetch all rows
            rows = result.fetchall()
            
            # Convert to list of dicts
            data = []
            for row in rows[:max_rows]:
                row_dict = {}
                for i, col in enumerate(columns):
                    value = row[i]
                    # Convert non-serializable types to strings
                    if hasattr(value, 'isoformat'):  # datetime/date
                        value = value.isoformat()
                    elif hasattr(value, '__str__') and not isinstance(value, (str, int, float, bool, type(None))):
                        value = str(value)
                    row_dict[col] = value
                data.append(row_dict)
            
            return SQLExecutionResult(
                success=True,
                data=data,
                row_count=len(data),
                columns=columns
            )
            
        except Exception as e:
            logger.error(f"Error executing SQL query: {str(e)}")
            return SQLExecutionResult(
                success=False,
                error=f"Query execution failed: {str(e)}"
            )
    
    def format_results_for_ai(
        self,
        result: SQLExecutionResult,
        original_query: str,
        query_type: str
    ) -> str:
        """
        Format query results for AI to generate natural language response
        
        Args:
            result: The SQL execution result
            original_query: The original natural language query
            query_type: Type of query (count, list, aggregate, grouped)
            
        Returns:
            Formatted string for AI consumption
        """
        if not result.success:
            return f"Query failed with error: {result.error}"
        
        if result.row_count == 0:
            return "The query returned no results."
        
        # Format based on query type
        if query_type == "count":
            # For count queries, extract the count value
            if result.data and len(result.data) == 1:
                first_row = result.data[0]
                # Find the count column
                for key, value in first_row.items():
                    if 'count' in key.lower() or 'total' in key.lower():
                        return f"Count result: {value}"
                # If no specific count column, just show the first value
                first_value = list(first_row.values())[0]
                return f"Count result: {first_value}"
        
        elif query_type == "aggregate":
            # For aggregate queries, format as key-value pairs
            if result.data:
                formatted = "Aggregate results:\n"
                for row in result.data:
                    formatted += " - " + ", ".join(f"{k}: {v}" for k, v in row.items()) + "\n"
                return formatted
        
        elif query_type == "grouped":
            # For grouped queries, format as a summary table
            if result.data:
                formatted = f"Grouped results ({result.row_count} groups):\n"
                for row in result.data[:20]:  # Limit to 20 groups for readability
                    formatted += " - " + ", ".join(f"{k}: {v}" for k, v in row.items()) + "\n"
                if result.row_count > 20:
                    formatted += f"... and {result.row_count - 20} more groups\n"
                return formatted
        
        else:  # list
            # For list queries, format as a table-like structure
            if result.data:
                formatted = f"Found {result.row_count} result(s):\n\n"
                
                # If only a few results, show details
                if result.row_count <= 10:
                    for i, row in enumerate(result.data, 1):
                        formatted += f"{i}. "
                        # Show key fields
                        key_fields = []
                        for k, v in row.items():
                            if v is not None:
                                key_fields.append(f"{k}: {v}")
                        formatted += ", ".join(key_fields[:5])  # Limit fields shown
                        if len(key_fields) > 5:
                            formatted += ", ..."
                        formatted += "\n"
                else:
                    # For many results, show summary
                    formatted += f"Showing first 10 of {result.row_count} results:\n"
                    for i, row in enumerate(result.data[:10], 1):
                        key_fields = []
                        for k, v in row.items():
                            if v is not None:
                                key_fields.append(f"{k}: {v}")
                        formatted += f"{i}. " + ", ".join(key_fields[:3]) + "\n"
                
                return formatted
        
        return f"Query returned {result.row_count} row(s)."
    
    def format_results_as_markdown_table(
        self,
        result: SQLExecutionResult,
        max_display_rows: int = 20
    ) -> str:
        """
        Format results as a markdown table for display
        
        Args:
            result: The SQL execution result
            max_display_rows: Maximum rows to display in table
            
        Returns:
            Markdown formatted table string
        """
        if not result.success or not result.data:
            return ""
        
        # Get columns
        if not result.columns:
            return ""
        
        # Build header
        header = "| " + " | ".join(result.columns) + " |"
        separator = "| " + " | ".join(["---"] * len(result.columns)) + " |"
        
        # Build rows
        rows = []
        for row in result.data[:max_display_rows]:
            row_values = []
            for col in result.columns:
                value = row.get(col, "")
                if value is None:
                    value = "-"
                else:
                    value = str(value)
                    # Truncate long values
                    if len(value) > 50:
                        value = value[:47] + "..."
                row_values.append(value)
            rows.append("| " + " | ".join(row_values) + " |")
        
        table = "\n".join([header, separator] + rows)
        
        if result.row_count > max_display_rows:
            table += f"\n\n*Showing {max_display_rows} of {result.row_count} results*"
        
        return table


# Singleton instance
_sql_executor_service = None


def get_sql_executor_service() -> SQLExecutorService:
    """Get or create SQL executor service instance"""
    global _sql_executor_service
    if _sql_executor_service is None:
        _sql_executor_service = SQLExecutorService()
    return _sql_executor_service
