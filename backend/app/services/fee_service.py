from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from decimal import Decimal
from datetime import date, datetime
from app.models.fee import FeeStructure, FeeAssignment, FeePayment, PaymentStatus
from app.models.student import Student
from app.models.academic import Class, Term
from app.models.user import User
from app.schemas.fee import (
    FeeStructureCreate, FeeStructureUpdate, FeeAssignmentCreate,
    FeePaymentCreate, BulkFeeAssignmentCreate
)
import uuid


class FeeService:
    """Service class for fee management operations"""
    
    # Fee Structure Management
    @staticmethod
    async def create_fee_structure(
        db: AsyncSession,
        fee_data: FeeStructureCreate,
        school_id: str
    ) -> FeeStructure:
        """Create a new fee structure"""
        # Check if fee structure already exists for the same type, session, and class level
        result = await db.execute(
            select(FeeStructure).where(
                FeeStructure.fee_type == fee_data.fee_type,
                FeeStructure.academic_session == fee_data.academic_session,
                FeeStructure.class_level == fee_data.class_level,
                FeeStructure.school_id == school_id,
                FeeStructure.is_deleted == False
            )
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Fee structure already exists for this type, session, and class level"
            )
        
        # Create fee structure
        fee_dict = fee_data.dict()
        fee_dict['school_id'] = school_id
        
        fee_structure = FeeStructure(**fee_dict)
        db.add(fee_structure)
        await db.commit()
        await db.refresh(fee_structure)
        
        return fee_structure
    
    @staticmethod
    async def get_fee_structures(
        db: AsyncSession,
        school_id: str,
        academic_session: Optional[str] = None,
        class_level: Optional[str] = None,
        fee_type: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[FeeStructure]:
        """Get fee structures with filtering"""
        query = select(FeeStructure).where(
            FeeStructure.school_id == school_id,
            FeeStructure.is_deleted == False
        )
        
        if academic_session:
            query = query.where(FeeStructure.academic_session == academic_session)
        
        if class_level:
            query = query.where(FeeStructure.class_level == class_level)
        
        if fee_type:
            query = query.where(FeeStructure.fee_type == fee_type)
        
        if is_active is not None:
            query = query.where(FeeStructure.is_active == is_active)
        
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())
    
    @staticmethod
    async def update_fee_structure(
        db: AsyncSession,
        fee_structure_id: str,
        school_id: str,
        fee_data: FeeStructureUpdate
    ) -> Optional[FeeStructure]:
        """Update fee structure"""
        result = await db.execute(
            select(FeeStructure).where(
                FeeStructure.id == fee_structure_id,
                FeeStructure.school_id == school_id,
                FeeStructure.is_deleted == False
            )
        )
        fee_structure = result.scalar_one_or_none()
        
        if not fee_structure:
            return None
        
        # Update fields
        update_data = fee_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(fee_structure, field, value)
        
        await db.commit()
        await db.refresh(fee_structure)
        
        return fee_structure
    
    # Fee Assignment Management
    @staticmethod
    async def create_fee_assignment(
        db: AsyncSession,
        assignment_data: FeeAssignmentCreate,
        school_id: str
    ) -> FeeAssignment:
        """Create a new fee assignment"""
        # Check if assignment already exists
        result = await db.execute(
            select(FeeAssignment).where(
                FeeAssignment.student_id == assignment_data.student_id,
                FeeAssignment.fee_structure_id == assignment_data.fee_structure_id,
                FeeAssignment.term_id == assignment_data.term_id,
                FeeAssignment.school_id == school_id,
                FeeAssignment.is_deleted == False
            )
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Fee assignment already exists for this student, fee structure, and term"
            )
        
        # Verify student, fee structure, and term exist
        # (Add validation logic here)
        
        # Create fee assignment
        assignment_dict = assignment_data.dict()
        assignment_dict['school_id'] = school_id
        assignment_dict['amount_outstanding'] = assignment_data.amount - assignment_data.discount_amount
        
        assignment = FeeAssignment(**assignment_dict)
        db.add(assignment)
        await db.commit()
        await db.refresh(assignment)
        
        return assignment
    
    @staticmethod
    async def bulk_create_fee_assignments(
        db: AsyncSession,
        bulk_data: BulkFeeAssignmentCreate,
        school_id: str
    ) -> List[FeeAssignment]:
        """Create fee assignments for multiple students"""
        # Get fee structure
        fee_result = await db.execute(
            select(FeeStructure).where(
                FeeStructure.id == bulk_data.fee_structure_id,
                FeeStructure.school_id == school_id,
                FeeStructure.is_deleted == False
            )
        )
        fee_structure = fee_result.scalar_one_or_none()
        
        if not fee_structure:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Fee structure not found"
            )
        
        # Get students from specified classes
        students_result = await db.execute(
            select(Student).where(
                Student.current_class_id.in_(bulk_data.class_ids),
                Student.school_id == school_id,
                Student.is_deleted == False
            )
        )
        students = students_result.scalars().all()
        
        assignments = []
        for student in students:
            # Check if assignment already exists
            existing_result = await db.execute(
                select(FeeAssignment).where(
                    FeeAssignment.student_id == student.id,
                    FeeAssignment.fee_structure_id == bulk_data.fee_structure_id,
                    FeeAssignment.term_id == bulk_data.term_id,
                    FeeAssignment.school_id == school_id,
                    FeeAssignment.is_deleted == False
                )
            )
            if existing_result.scalar_one_or_none():
                continue  # Skip if already exists
            
            # Create assignment
            assignment = FeeAssignment(
                student_id=student.id,
                fee_structure_id=bulk_data.fee_structure_id,
                term_id=bulk_data.term_id,
                assigned_date=date.today(),
                due_date=bulk_data.due_date,
                amount=fee_structure.amount,
                discount_amount=bulk_data.discount_amount or Decimal('0.00'),
                discount_reason=bulk_data.discount_reason,
                amount_outstanding=fee_structure.amount - (bulk_data.discount_amount or Decimal('0.00')),
                school_id=school_id
            )
            
            db.add(assignment)
            assignments.append(assignment)
        
        await db.commit()
        
        # Refresh all assignments
        for assignment in assignments:
            await db.refresh(assignment)
        
        return assignments
    
    @staticmethod
    async def get_student_fee_assignments(
        db: AsyncSession,
        student_id: str,
        school_id: str,
        term_id: Optional[str] = None,
        status: Optional[PaymentStatus] = None
    ) -> List[FeeAssignment]:
        """Get fee assignments for a student"""
        query = select(FeeAssignment).where(
            FeeAssignment.student_id == student_id,
            FeeAssignment.school_id == school_id,
            FeeAssignment.is_deleted == False
        ).options(
            selectinload(FeeAssignment.fee_structure),
            selectinload(FeeAssignment.term),
            selectinload(FeeAssignment.student)
        )
        
        if term_id:
            query = query.where(FeeAssignment.term_id == term_id)
        
        if status:
            query = query.where(FeeAssignment.status == status)
        
        result = await db.execute(query)
        return list(result.scalars().all())
    
    # Payment Management
    @staticmethod
    async def create_payment(
        db: AsyncSession,
        payment_data: FeePaymentCreate,
        collected_by: str,
        school_id: str
    ) -> FeePayment:
        """Create a new fee payment"""
        # Get fee assignment
        assignment_result = await db.execute(
            select(FeeAssignment).where(
                FeeAssignment.id == payment_data.fee_assignment_id,
                FeeAssignment.school_id == school_id,
                FeeAssignment.is_deleted == False
            )
        )
        assignment = assignment_result.scalar_one_or_none()
        
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Fee assignment not found"
            )
        
        # Validate payment amount
        if payment_data.amount > assignment.amount_outstanding:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment amount exceeds outstanding amount"
            )
        
        # Generate receipt number
        receipt_number = f"RCP-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        # Create payment
        payment_dict = payment_data.dict()
        payment_dict['collected_by'] = collected_by
        payment_dict['school_id'] = school_id
        payment_dict['receipt_number'] = receipt_number
        
        payment = FeePayment(**payment_dict)
        db.add(payment)
        
        # Update fee assignment
        assignment.amount_paid += payment_data.amount
        assignment.amount_outstanding -= payment_data.amount
        
        # Update status
        if assignment.amount_outstanding <= 0:
            assignment.status = PaymentStatus.PAID
        elif assignment.amount_paid > 0:
            assignment.status = PaymentStatus.PARTIAL
        
        await db.commit()
        await db.refresh(payment)
        
        return payment
    
    @staticmethod
    async def get_student_payments(
        db: AsyncSession,
        student_id: str,
        school_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[FeePayment]:
        """Get payments for a student"""
        result = await db.execute(
            select(FeePayment).where(
                FeePayment.student_id == student_id,
                FeePayment.school_id == school_id,
                FeePayment.is_deleted == False
            ).options(
                selectinload(FeePayment.fee_assignment),
                selectinload(FeePayment.collector)
            ).offset(skip).limit(limit)
        )
        return list(result.scalars().all())
    
    @staticmethod
    async def get_fee_report(
        db: AsyncSession,
        school_id: str,
        term_id: Optional[str] = None,
        class_id: Optional[str] = None
    ) -> dict:
        """Generate fee collection report"""
        query = select(FeeAssignment).where(
            FeeAssignment.school_id == school_id,
            FeeAssignment.is_deleted == False
        )
        
        if term_id:
            query = query.where(FeeAssignment.term_id == term_id)
        
        if class_id:
            # Join with student to filter by class
            query = query.join(Student).where(Student.current_class_id == class_id)
        
        result = await db.execute(query)
        assignments = result.scalars().all()
        
        total_expected = sum(assignment.amount for assignment in assignments)
        total_collected = sum(assignment.amount_paid for assignment in assignments)
        total_outstanding = sum(assignment.amount_outstanding for assignment in assignments)
        
        collection_percentage = (total_collected / total_expected * 100) if total_expected > 0 else 0
        
        # Calculate overdue amount
        today = date.today()
        overdue_amount = sum(
            assignment.amount_outstanding 
            for assignment in assignments 
            if assignment.due_date < today and assignment.amount_outstanding > 0
        )
        
        return {
            "total_expected": total_expected,
            "total_collected": total_collected,
            "total_outstanding": total_outstanding,
            "collection_percentage": round(collection_percentage, 2),
            "overdue_amount": overdue_amount
        }
