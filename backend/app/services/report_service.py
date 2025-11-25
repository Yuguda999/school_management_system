from typing import List, Optional, Dict, Any
from datetime import date, datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, extract
from app.models.fee import FeeAssignment, FeePayment, FeeStructure, PaymentStatus, FeeType
from app.schemas.report import FinancialReport, MonthlyRevenue, FeeTypeBreakdown

class ReportService:
    @staticmethod
    async def get_financial_report(
        db: AsyncSession,
        school_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        term_id: Optional[str] = None,
        class_id: Optional[str] = None,
        fee_type: Optional[str] = None,
        payment_status: Optional[str] = None
    ) -> FinancialReport:
        """
        Generate financial report for a school within a date range and optional filters.
        """
        from app.models.student import Student
        
        # Base query conditions
        payment_conditions = [FeePayment.school_id == school_id]
        assignment_conditions = [FeeAssignment.school_id == school_id]
        
        if start_date:
            payment_conditions.append(FeePayment.payment_date >= start_date)
            assignment_conditions.append(FeeAssignment.assigned_date >= start_date)
            
        if end_date:
            payment_conditions.append(FeePayment.payment_date <= end_date)
            assignment_conditions.append(FeeAssignment.assigned_date <= end_date)
            
        if term_id:
            assignment_conditions.append(FeeAssignment.term_id == term_id)
            # For payments, we'll need to join assignment if term_id is present
            
        # Helper to apply common joins and filters
        def apply_filters(query, model_type):
            # model_type is either 'payment' or 'assignment'
            q = query
            
            # Join Student for class_id filter
            if class_id:
                if model_type == 'payment':
                    q = q.join(Student, FeePayment.student_id == Student.id)
                else:
                    q = q.join(Student, FeeAssignment.student_id == Student.id)
                q = q.where(Student.current_class_id == class_id)
                
            # Join FeeStructure for fee_type filter
            if fee_type:
                if model_type == 'payment':
                    q = q.join(FeeAssignment, FeePayment.fee_assignment_id == FeeAssignment.id)
                    q = q.join(FeeStructure, FeeAssignment.fee_structure_id == FeeStructure.id)
                else:
                    q = q.join(FeeStructure, FeeAssignment.fee_structure_id == FeeStructure.id)
                q = q.where(FeeStructure.fee_type == fee_type)
                
            # Apply term_id filter to payments if not already handled
            if term_id and model_type == 'payment':
                # If we haven't joined FeeAssignment yet
                if not fee_type: 
                    q = q.join(FeeAssignment, FeePayment.fee_assignment_id == FeeAssignment.id)
                q = q.where(FeeAssignment.term_id == term_id)

            return q

        # 1. Calculate Total Revenue (Total Collected)
        revenue_query = select(func.sum(FeePayment.amount)).where(and_(*payment_conditions))
        revenue_query = apply_filters(revenue_query, 'payment')
        
        revenue_result = await db.execute(revenue_query)
        total_revenue = revenue_result.scalar() or 0.0
        fees_collected = total_revenue

        # 2. Calculate Pending and Overdue Fees
        # Filter assignments by status if provided, otherwise include all relevant statuses
        target_statuses = [PaymentStatus.PENDING, PaymentStatus.PARTIAL, PaymentStatus.OVERDUE]
        if payment_status:
             # If user filters by 'paid', pending should be 0? 
             # Or if they filter by 'pending', we show pending.
             if payment_status.lower() == 'paid':
                 target_statuses = [] # No pending fees if looking at paid only
             elif payment_status.lower() == 'overdue':
                 target_statuses = [PaymentStatus.OVERDUE]
             elif payment_status.lower() == 'pending':
                 target_statuses = [PaymentStatus.PENDING, PaymentStatus.PARTIAL]

        pending_fees = 0.0
        if target_statuses:
            pending_query = select(func.sum(FeeAssignment.amount_outstanding)).where(
                and_(*assignment_conditions),
                FeeAssignment.status.in_(target_statuses)
            )
            pending_query = apply_filters(pending_query, 'assignment')
            pending_result = await db.execute(pending_query)
            pending_fees = pending_result.scalar() or 0.0

        overdue_fees = 0.0
        # Only calc overdue if not filtered out
        if not payment_status or payment_status.lower() == 'overdue':
            overdue_query = select(func.sum(FeeAssignment.amount_outstanding)).where(
                and_(*assignment_conditions),
                FeeAssignment.status == PaymentStatus.OVERDUE
            )
            overdue_query = apply_filters(overdue_query, 'assignment')
            overdue_result = await db.execute(overdue_query)
            overdue_fees = overdue_result.scalar() or 0.0

        # 3. Calculate Collection Rate
        total_expected = fees_collected + pending_fees
        collection_rate = (fees_collected / total_expected * 100) if total_expected > 0 else 0.0

        # 4. Calculate Monthly Revenue Trend
        monthly_trend_query = select(FeePayment.payment_date, FeePayment.amount).where(and_(*payment_conditions))
        monthly_trend_query = apply_filters(monthly_trend_query, 'payment')
            
        monthly_trend_result = await db.execute(monthly_trend_query)
        payments = monthly_trend_result.all()
        
        monthly_data = {}
        for payment_date, amount in payments:
            month_key = payment_date.strftime("%b")
            monthly_data[month_key] = monthly_data.get(month_key, 0.0) + float(amount)
            
        months_order = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        monthly_revenue = []
        for month in months_order:
            if month in monthly_data:
                monthly_revenue.append(MonthlyRevenue(month=month, amount=monthly_data[month]))
        
        if not monthly_revenue:
             monthly_revenue = [MonthlyRevenue(month=m, amount=0) for m in months_order[:6]]

        # 5. Calculate Fee Type Breakdown
        breakdown_query = select(
            FeeStructure.fee_type,
            func.sum(FeePayment.amount)
        ).join(
            FeeAssignment, FeePayment.fee_assignment_id == FeeAssignment.id
        ).join(
            FeeStructure, FeeAssignment.fee_structure_id == FeeStructure.id
        ).where(
            and_(*payment_conditions)
        ).group_by(
            FeeStructure.fee_type
        )
        
        # Apply filters manually here since structure is already joined
        if term_id:
            breakdown_query = breakdown_query.where(FeeAssignment.term_id == term_id)
        if class_id:
            breakdown_query = breakdown_query.join(Student, FeePayment.student_id == Student.id).where(Student.current_class_id == class_id)
        if fee_type:
            breakdown_query = breakdown_query.where(FeeStructure.fee_type == fee_type)
            
        breakdown_result = await db.execute(breakdown_query)
        breakdown_data = breakdown_result.all()
        
        fee_type_breakdown = []
        for f_type, amount in breakdown_data:
            percentage = (float(amount) / float(total_revenue) * 100) if total_revenue > 0 else 0.0
            fee_type_breakdown.append(
                FeeTypeBreakdown(
                    fee_type=f_type.value if hasattr(f_type, 'value') else str(f_type),
                    amount=float(amount),
                    percentage=round(percentage, 1)
                )
            )

        return FinancialReport(
            total_revenue=float(total_revenue),
            fees_collected=float(fees_collected),
            pending_fees=float(pending_fees),
            overdue_fees=float(overdue_fees),
            collection_rate=round(collection_rate, 1),
            monthly_revenue=monthly_revenue,
            fee_type_breakdown=fee_type_breakdown
        )

    @staticmethod
    async def export_financial_report_csv(
        db: AsyncSession,
        school_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        term_id: Optional[str] = None,
        class_id: Optional[str] = None,
        fee_type: Optional[str] = None,
        payment_status: Optional[str] = None
    ) -> str:
        """
        Generate CSV content for financial report
        """
        import csv
        import io

        report = await ReportService.get_financial_report(
            db, school_id, start_date, end_date, term_id, class_id, fee_type, payment_status
        )

        output = io.StringIO()
        writer = csv.writer(output)

        # Header
        writer.writerow(['Financial Report'])
        writer.writerow(['Generated At', datetime.now().strftime('%Y-%m-%d %H:%M:%S')])
        if start_date and end_date:
            writer.writerow(['Period', f"{start_date} to {end_date}"])
        writer.writerow([])

        # Summary
        writer.writerow(['Summary Metrics'])
        writer.writerow(['Total Revenue', report.total_revenue])
        writer.writerow(['Fees Collected', report.fees_collected])
        writer.writerow(['Pending Fees', report.pending_fees])
        writer.writerow(['Overdue Fees', report.overdue_fees])
        writer.writerow(['Collection Rate (%)', report.collection_rate])
        writer.writerow([])

        # Monthly Revenue
        writer.writerow(['Monthly Revenue Trend'])
        writer.writerow(['Month', 'Amount'])
        for item in report.monthly_revenue:
            writer.writerow([item.month, item.amount])
        writer.writerow([])

        # Fee Type Breakdown
        writer.writerow(['Fee Type Breakdown'])
        writer.writerow(['Fee Type', 'Amount', 'Percentage (%)'])
        for item in report.fee_type_breakdown:
            writer.writerow([item.fee_type, item.amount, item.percentage])

        return output.getvalue()
