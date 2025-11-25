from typing import List, Optional
from pydantic import BaseModel
from datetime import date

class MonthlyRevenue(BaseModel):
    month: str
    amount: float

class FeeTypeBreakdown(BaseModel):
    fee_type: str
    amount: float
    percentage: float

class FinancialReport(BaseModel):
    total_revenue: float
    fees_collected: float
    pending_fees: float
    overdue_fees: float
    collection_rate: float
    monthly_revenue: List[MonthlyRevenue]
    fee_type_breakdown: List[FeeTypeBreakdown]

class FinancialReportParams(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    term_id: Optional[str] = None
