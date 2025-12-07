from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from fastapi import HTTPException, status
from decimal import Decimal
from datetime import date, datetime, timedelta
from sqlalchemy.orm import selectinload, joinedload
from app.models.fee import FeeStructure, FeeAssignment, FeePayment, PaymentStatus, PaymentMethod
from app.models.student import Student, StudentStatus
from app.models.academic import Class, Term
from app.models.user import User
from app.schemas.fee import (
    FeeStructureCreate, FeeStructureUpdate, FeeAssignmentCreate,
    FeePaymentCreate, BulkFeeAssignmentCreate
)
import uuid
from app.services.notification_service import NotificationService
from app.schemas.notification import NotificationCreate
from app.models.notification import NotificationType


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
        # Check if fee structure already exists for the same type and session
        result = await db.execute(
            select(FeeStructure).where(
                FeeStructure.fee_type == fee_data.fee_type,
                FeeStructure.academic_session == fee_data.academic_session,
                FeeStructure.name == fee_data.name,
                FeeStructure.school_id == school_id,
                FeeStructure.is_deleted == False
            )
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Fee structure with this name already exists for this type and session"
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
        
        # Notify Students (Optional - depends on business logic)
        # If fee structure is updated, we might want to notify students in that class level.
        # For now, we will skip this as it might be spammy or irrelevant if no assignments exist.
        
        return fee_structure

    @staticmethod
    async def delete_fee_structure(
        db: AsyncSession,
        fee_structure_id: str,
        school_id: str
    ) -> bool:
        """Delete fee structure (soft delete)"""
        # First check if fee structure exists and belongs to the school
        result = await db.execute(
            select(FeeStructure).where(
                FeeStructure.id == fee_structure_id,
                FeeStructure.school_id == school_id,
                FeeStructure.is_deleted == False
            )
        )
        fee_structure = result.scalar_one_or_none()

        if not fee_structure:
            return False

        # Check if there are any active fee assignments for this structure
        assignments_result = await db.execute(
            select(func.count(FeeAssignment.id)).where(
                FeeAssignment.fee_structure_id == fee_structure_id,
                FeeAssignment.is_deleted == False
            )
        )
        assignment_count = assignments_result.scalar()

        if assignment_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete fee structure with existing assignments. Please remove all assignments first."
            )

        # Perform soft delete
        fee_structure.is_deleted = True
        fee_structure.updated_at = datetime.utcnow()

        await db.commit()
        return True

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
        
        # Notify Student
        # We need to fetch student user_id
        student_res = await db.execute(select(Student).where(Student.id == assignment_data.student_id))
        student = student_res.scalar_one_or_none()
        
        if student and student.user_id:
             # Fetch fee structure name
             fee_structure_res = await db.execute(select(FeeStructure).where(FeeStructure.id == assignment_data.fee_structure_id))
             fee_structure = fee_structure_res.scalar_one_or_none()
             fee_name = fee_structure.name if fee_structure else "Fee"
             
             await NotificationService.create_notification(
                db=db,
                school_id=school_id,
                notification_data=NotificationCreate(
                    user_id=student.user_id,
                    title="New Fee Assigned",
                    message=f"A new fee '{fee_name}' of {assignment.amount} has been assigned to you.",
                    type=NotificationType.WARNING, # Warning because it's a debt
                    link="/fees"
                )
            )

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
                due_date=bulk_data.due_date or fee_structure.due_date or (date.today() + timedelta(days=30)),
                amount=fee_structure.amount,
                discount_amount=bulk_data.discount_amount or Decimal('0.00'),
                discount_reason=bulk_data.discount_reason,
                amount_outstanding=fee_structure.amount - (bulk_data.discount_amount or Decimal('0.00')),
                school_id=school_id
            )
            
            db.add(assignment)
            assignments.append(assignment)
        
        await db.commit()
        
        await db.commit()
        
        # Fetch created assignments with relationships
        assignment_ids = [a.id for a in assignments]
        query = select(FeeAssignment).where(
            FeeAssignment.id.in_(assignment_ids)
        ).options(
            selectinload(FeeAssignment.student).selectinload(Student.current_class),
            selectinload(FeeAssignment.fee_structure),
            selectinload(FeeAssignment.term)
        )
        
        result = await db.execute(query)
        assignments = result.scalars().all()
        
        # Notify Students
        for assignment in assignments:
            if assignment.student and assignment.student.user_id:
                 await NotificationService.create_notification(
                    db=db,
                    school_id=school_id,
                    notification_data=NotificationCreate(
                        user_id=assignment.student.user_id,
                        title="New Fee Assigned",
                        message=f"A new fee '{assignment.fee_structure.name}' of {assignment.amount} has been assigned to you.",
                        type=NotificationType.WARNING,
                        link="/fees"
                    )
                )

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
            selectinload(FeeAssignment.student).selectinload(Student.current_class)
        )
        
        if term_id:
            query = query.where(FeeAssignment.term_id == term_id)
        
        if status:
            query = query.where(FeeAssignment.status == status)
        
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_fee_assignments(
        db: AsyncSession,
        school_id: str,
        term_id: Optional[str] = None,
        class_id: Optional[str] = None,
        status: Optional[PaymentStatus] = None,
        fee_type: Optional[str] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[FeeAssignment]:
        """Get all fee assignments for a school with filters"""
        query = select(FeeAssignment).where(
            FeeAssignment.school_id == school_id,
            FeeAssignment.is_deleted == False
        ).options(
            selectinload(FeeAssignment.fee_structure),
            selectinload(FeeAssignment.term),
            selectinload(FeeAssignment.student).selectinload(Student.user),
            selectinload(FeeAssignment.student).selectinload(Student.current_class)
        )
        
        if term_id:
            query = query.where(FeeAssignment.term_id == term_id)
            
        if class_id:
            query = query.join(Student).where(Student.current_class_id == class_id)
            
        if status:
            query = query.where(FeeAssignment.status == status)

        if fee_type:
            query = query.join(FeeStructure).where(FeeStructure.fee_type == fee_type)

        if search:
            search_term = f"%{search}%"
            if not class_id:
                query = query.join(Student)
            
            query = query.where(
                or_(
                    Student.first_name.ilike(search_term),
                    Student.last_name.ilike(search_term),
                    Student.middle_name.ilike(search_term),
                    Student.admission_number.ilike(search_term)
                )
            )
            
        query = query.offset(skip).limit(limit).order_by(FeeAssignment.created_at.desc())
        
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_payments(
        db: AsyncSession,
        school_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        payment_method: Optional[PaymentMethod] = None,
        class_id: Optional[str] = None,
        status: Optional[PaymentStatus] = None,
        term_id: Optional[str] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[FeePayment]:
        """Get all payments for a school with filters"""
        query = select(FeePayment).options(
            selectinload(FeePayment.student).selectinload(Student.current_class),
            selectinload(FeePayment.fee_assignment).selectinload(FeeAssignment.fee_structure)
        ).where(
            FeePayment.school_id == school_id,
            FeePayment.is_deleted == False
        ).join(FeePayment.student).join(FeePayment.fee_assignment).options(
            selectinload(FeePayment.fee_assignment).selectinload(FeeAssignment.student).selectinload(Student.user),
            selectinload(FeePayment.fee_assignment).selectinload(FeeAssignment.student).selectinload(Student.current_class),
            selectinload(FeePayment.fee_assignment).selectinload(FeeAssignment.fee_structure)
        )
        
        if start_date:
            query = query.where(FeePayment.payment_date >= start_date)
            
        if end_date:
            query = query.where(FeePayment.payment_date <= end_date)
            
        if payment_method:
            query = query.where(FeePayment.payment_method == payment_method)
            
        if class_id:
            query = query.where(Student.current_class_id == class_id)
            
        if status:
            query = query.where(FeeAssignment.status == status)

        if term_id:
            query = query.where(FeeAssignment.term_id == term_id)
            
        if search:
            search_term = f"%{search}%"
            query = query.where(
                or_(
                    Student.first_name.ilike(search_term),
                    Student.last_name.ilike(search_term),
                    Student.middle_name.ilike(search_term),
                    Student.admission_number.ilike(search_term)
                )
            )
            
        query = query.offset(skip).limit(limit).order_by(FeePayment.payment_date.desc())
        
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
            
        if assignment.status == PaymentStatus.PAID:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Fee assignment is already fully paid"
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
        await db.commit()
        
        # Fetch payment with relationships
        result = await db.execute(
            select(FeePayment)
            .options(
                selectinload(FeePayment.student).selectinload(Student.current_class),
                selectinload(FeePayment.collector),
                selectinload(FeePayment.fee_assignment).selectinload(FeeAssignment.fee_structure)
            )
            .where(FeePayment.id == payment.id)
        )
        payment = result.scalar_one()
        
        # Send Notification to Student/Parent
        if payment.student and payment.student.user_id:
            await NotificationService.create_notification(
                db=db,
                school_id=school_id,
                notification_data=NotificationCreate(
                    user_id=payment.student.user_id,
                    title="Payment Received",
                    message=f"We have received your payment of {payment.amount} for {payment.fee_assignment.fee_structure.name}. Receipt: {payment.receipt_number}",
                    type=NotificationType.SUCCESS,
                    link=f"/fees/payments"
                )
            )

        return payment
    
    @staticmethod
    async def get_student_payments(
        db: AsyncSession,
        student_id: str,
        school_id: str,
        term_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[FeePayment]:
        """Get payments for a student"""
        query = select(FeePayment).where(
            FeePayment.student_id == student_id,
            FeePayment.school_id == school_id,
            FeePayment.is_deleted == False
        ).options(
            selectinload(FeePayment.fee_assignment).selectinload(FeeAssignment.fee_structure),
            selectinload(FeePayment.fee_assignment).selectinload(FeeAssignment.term),
            selectinload(FeePayment.collector),
            selectinload(FeePayment.student).selectinload(Student.current_class)
        )
        
        if term_id:
            query = query.join(FeePayment.fee_assignment).where(FeeAssignment.term_id == term_id)
            
        query = query.offset(skip).limit(limit).order_by(FeePayment.payment_date.desc())
        
        result = await db.execute(query)
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
