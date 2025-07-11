from typing import Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import (
    get_current_active_user, 
    require_admin, 
    require_super_admin,
    get_current_school
)
from app.models.user import User, UserRole
from app.models.school import School
from app.models.fee import PaymentStatus
from app.schemas.fee import (
    FeeStructureCreate,
    FeeStructureUpdate,
    FeeStructureResponse,
    FeeAssignmentCreate,
    FeeAssignmentResponse,
    FeePaymentCreate,
    FeePaymentResponse,
    BulkFeeAssignmentCreate,
    StudentFeesSummary,
    FeeReport
)
from app.services.fee_service import FeeService

router = APIRouter()


# Fee Structure Management
@router.post("/structures", response_model=FeeStructureResponse)
async def create_fee_structure(
    fee_data: FeeStructureCreate,
    current_user: User = Depends(require_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a new fee structure (Admin/Super Admin only)"""
    fee_structure = await FeeService.create_fee_structure(db, fee_data, current_school.id)
    return FeeStructureResponse.from_orm(fee_structure)


@router.get("/structures", response_model=List[FeeStructureResponse])
async def get_fee_structures(
    academic_session: Optional[str] = Query(None, description="Filter by academic session"),
    class_level: Optional[str] = Query(None, description="Filter by class level"),
    fee_type: Optional[str] = Query(None, description="Filter by fee type"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(require_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get fee structures (Admin/Super Admin only)"""
    skip = (page - 1) * size
    fee_structures = await FeeService.get_fee_structures(
        db, current_school.id, academic_session, class_level, fee_type, is_active, skip, size
    )
    
    return [FeeStructureResponse.from_orm(fs) for fs in fee_structures]


@router.put("/structures/{structure_id}", response_model=FeeStructureResponse)
async def update_fee_structure(
    structure_id: str,
    fee_data: FeeStructureUpdate,
    current_user: User = Depends(require_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update fee structure (Admin/Super Admin only)"""
    updated_structure = await FeeService.update_fee_structure(
        db, structure_id, current_school.id, fee_data
    )
    
    if not updated_structure:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fee structure not found"
        )
    
    return FeeStructureResponse.from_orm(updated_structure)


# Fee Assignment Management
@router.post("/assignments", response_model=FeeAssignmentResponse)
async def create_fee_assignment(
    assignment_data: FeeAssignmentCreate,
    current_user: User = Depends(require_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a new fee assignment (Admin/Super Admin only)"""
    assignment = await FeeService.create_fee_assignment(db, assignment_data, current_school.id)
    
    # Enhance response with related data
    response = FeeAssignmentResponse.from_orm(assignment)
    # Add related names (you might want to optimize this with joins)
    
    return response


@router.post("/assignments/bulk", response_model=List[FeeAssignmentResponse])
async def bulk_create_fee_assignments(
    bulk_data: BulkFeeAssignmentCreate,
    current_user: User = Depends(require_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create fee assignments for multiple students (Admin/Super Admin only)"""
    assignments = await FeeService.bulk_create_fee_assignments(db, bulk_data, current_school.id)
    
    return [FeeAssignmentResponse.from_orm(assignment) for assignment in assignments]


@router.get("/students/{student_id}/assignments", response_model=List[FeeAssignmentResponse])
async def get_student_fee_assignments(
    student_id: str,
    term_id: Optional[str] = Query(None, description="Filter by term"),
    status: Optional[PaymentStatus] = Query(None, description="Filter by payment status"),
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get fee assignments for a student"""
    # Check permissions - users can view their own child's fees, admins can view any
    if (current_user.role == UserRole.PARENT and 
        not await _is_parent_of_student(db, current_user.id, student_id)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    assignments = await FeeService.get_student_fee_assignments(
        db, student_id, current_school.id, term_id, status
    )
    
    # Enhance response with related data
    response_assignments = []
    for assignment in assignments:
        assignment_response = FeeAssignmentResponse.from_orm(assignment)
        
        # Add related names
        if hasattr(assignment, 'student') and assignment.student:
            assignment_response.student_name = assignment.student.full_name
        if hasattr(assignment, 'fee_structure') and assignment.fee_structure:
            assignment_response.fee_structure_name = assignment.fee_structure.name
        if hasattr(assignment, 'term') and assignment.term:
            assignment_response.term_name = assignment.term.name
        
        response_assignments.append(assignment_response)
    
    return response_assignments


# Payment Management
@router.post("/payments", response_model=FeePaymentResponse)
async def create_fee_payment(
    payment_data: FeePaymentCreate,
    current_user: User = Depends(require_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a new fee payment (Admin/Super Admin only)"""
    payment = await FeeService.create_payment(
        db, payment_data, current_user.id, current_school.id
    )
    
    # Enhance response with related data
    response = FeePaymentResponse.from_orm(payment)
    
    # Add related names
    if hasattr(payment, 'student') and payment.student:
        response.student_name = payment.student.full_name
    if hasattr(payment, 'collector') and payment.collector:
        response.collector_name = payment.collector.full_name
    
    return response


@router.get("/students/{student_id}/payments", response_model=List[FeePaymentResponse])
async def get_student_payments(
    student_id: str,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get payments for a student"""
    # Check permissions - users can view their own child's payments, admins can view any
    if (current_user.role == UserRole.PARENT and 
        not await _is_parent_of_student(db, current_user.id, student_id)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    skip = (page - 1) * size
    payments = await FeeService.get_student_payments(
        db, student_id, current_school.id, skip, size
    )
    
    # Enhance response with related data
    response_payments = []
    for payment in payments:
        payment_response = FeePaymentResponse.from_orm(payment)
        
        # Add related names
        if hasattr(payment, 'student') and payment.student:
            payment_response.student_name = payment.student.full_name
        if hasattr(payment, 'collector') and payment.collector:
            payment_response.collector_name = payment.collector.full_name
        
        response_payments.append(payment_response)
    
    return response_payments


# Reports
@router.get("/reports/collection", response_model=FeeReport)
async def get_fee_collection_report(
    term_id: Optional[str] = Query(None, description="Filter by term"),
    class_id: Optional[str] = Query(None, description="Filter by class"),
    current_user: User = Depends(require_admin()),
    current_school: School = Depends(get_current_school),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get fee collection report (Admin/Super Admin only)"""
    report_data = await FeeService.get_fee_report(
        db, current_school.id, term_id, class_id
    )
    
    return FeeReport(**report_data)


# Helper function
async def _is_parent_of_student(db: AsyncSession, parent_id: str, student_id: str) -> bool:
    """Check if user is parent of the student"""
    from sqlalchemy import select
    from app.models.student import Student
    
    result = await db.execute(
        select(Student).where(
            Student.id == student_id,
            Student.parent_id == parent_id,
            Student.is_deleted == False
        )
    )
    return result.scalar_one_or_none() is not None
