from typing import Any, Optional, List
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import (
    get_current_active_user,
    require_school_admin,
    get_current_school,
    SchoolContext
)
from app.models.user import User, UserRole
from app.models.school import School
from app.models.fee import PaymentStatus, PaymentMethod
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


# Fee Statistics
@router.get("/stats", response_model=FeeReport)
async def get_fee_stats(
    term_id: Optional[str] = Query(None, description="Filter by term"),
    class_id: Optional[str] = Query(None, description="Filter by class"),
    school_context: SchoolContext = Depends(require_school_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get fee statistics (Admin/Super Admin only)"""
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    stats = await FeeService.get_fee_report(
        db, current_school.id, term_id, class_id
    )
    
    return FeeReport(**stats)


# Fee Structure Management
@router.post("/structures", response_model=FeeStructureResponse)
async def create_fee_structure(
    fee_data: FeeStructureCreate,
    school_context: SchoolContext = Depends(require_school_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a new fee structure (Admin/Super Admin only)"""
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"Received fee structure creation request")
    logger.info(f"Fee data: {fee_data.dict()}")
    
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    try:
        fee_structure = await FeeService.create_fee_structure(db, fee_data, current_school.id)
        return FeeStructureResponse.from_orm(fee_structure)
    except Exception as e:
        logger.error(f"Error creating fee structure: {str(e)}")
        raise


@router.get("/structures", response_model=List[FeeStructureResponse])
async def get_fee_structures(
    academic_session: Optional[str] = Query(None, description="Filter by academic session"),
    class_level: Optional[str] = Query(None, description="Filter by class level"),
    fee_type: Optional[str] = Query(None, description="Filter by fee type"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    school_context: SchoolContext = Depends(require_school_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get fee structures (Admin/Super Admin only)"""
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    skip = (page - 1) * size
    fee_structures = await FeeService.get_fee_structures(
        db, current_school.id, academic_session, class_level, fee_type, is_active, skip, size
    )
    
    return [FeeStructureResponse.from_orm(fs) for fs in fee_structures]


@router.put("/structures/{structure_id}", response_model=FeeStructureResponse)
async def update_fee_structure(
    structure_id: str,
    fee_data: FeeStructureUpdate,
    school_context: SchoolContext = Depends(require_school_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update fee structure (Admin/Super Admin only)"""
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    updated_structure = await FeeService.update_fee_structure(
        db, structure_id, current_school.id, fee_data
    )
    
    if not updated_structure:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fee structure not found"
        )
    
    return FeeStructureResponse.from_orm(updated_structure)


@router.delete("/structures/{structure_id}")
async def delete_fee_structure(
    structure_id: str,
    school_context: SchoolContext = Depends(require_school_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Delete fee structure (Admin/Super Admin only)"""
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    success = await FeeService.delete_fee_structure(
        db, structure_id, current_school.id
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fee structure not found"
        )

    return {"message": "Fee structure deleted successfully"}


# Fee Assignment Management
@router.post("/assignments", response_model=FeeAssignmentResponse)
async def create_fee_assignment(
    assignment_data: FeeAssignmentCreate,
    school_context: SchoolContext = Depends(require_school_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a new fee assignment (Admin/Super Admin only)"""
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    assignment = await FeeService.create_fee_assignment(db, assignment_data, current_school.id)
    
    # Enhance response with related data
    response = FeeAssignmentResponse.from_orm(assignment)
    # Add related names (you might want to optimize this with joins)
    
    return response


@router.post("/assignments/bulk", response_model=List[FeeAssignmentResponse])
async def bulk_create_fee_assignments(
    bulk_data: BulkFeeAssignmentCreate,
    school_context: SchoolContext = Depends(require_school_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create fee assignments for multiple students (Admin/Super Admin only)"""
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    assignments = await FeeService.bulk_create_fee_assignments(db, bulk_data, current_school.id)
    
    # Enhance response with related data
    return [FeeAssignmentResponse.from_orm(assignment) for assignment in assignments]


@router.get("/assignments", response_model=List[FeeAssignmentResponse])
async def get_fee_assignments(
    term_id: Optional[str] = Query(None, description="Filter by term"),
    class_id: Optional[str] = Query(None, description="Filter by class"),
    status: Optional[PaymentStatus] = Query(None, description="Filter by payment status"),
    fee_type: Optional[str] = Query(None, description="Filter by fee type"),
    search: Optional[str] = Query(None, description="Search by student name or admission number"),
    skip: int = Query(0, description="Skip N items"),
    limit: int = Query(100, description="Limit results"),
    school_context: SchoolContext = Depends(require_school_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all fee assignments (Admin/Super Admin only)"""
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    assignments = await FeeService.get_fee_assignments(
        db, current_school.id, term_id, class_id, status, fee_type, search, skip, limit
    )
    
    return [FeeAssignmentResponse.from_orm(assignment) for assignment in assignments]


# Payment Management
@router.get("/payments", response_model=List[FeePaymentResponse])
async def get_payments(
    start_date: Optional[date] = Query(None, description="Filter by start date"),
    end_date: Optional[date] = Query(None, description="Filter by end date"),
    payment_method: Optional[PaymentMethod] = Query(None, description="Filter by payment method"),
    class_id: Optional[str] = Query(None, description="Filter by class"),
    status: Optional[PaymentStatus] = Query(None, description="Filter by payment status"),
    term_id: Optional[str] = Query(None, description="Filter by term"),
    search: Optional[str] = Query(None, description="Search term"),
    skip: int = Query(0, description="Skip results"),
    limit: int = Query(100, description="Limit results"),
    school_context: SchoolContext = Depends(require_school_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get all payments (Admin/Super Admin only)"""
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    payments = await FeeService.get_payments(
        db=db,
        school_id=current_school.id,
        start_date=start_date,
        end_date=end_date,
        payment_method=payment_method,
        class_id=class_id,
        status=status,
        term_id=term_id,
        search=search,
        skip=skip,
        limit=limit
    )
    
    return [FeePaymentResponse.from_orm(payment) for payment in payments]
    
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
    school_context: SchoolContext = Depends(require_school_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a new fee payment (Admin/Super Admin only)"""
    current_user = school_context.user
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
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
    school_context: SchoolContext = Depends(require_school_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get fee collection report (Admin/Super Admin only)"""
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    report_data = await FeeService.get_fee_report(
        db, current_school.id, term_id, class_id
    )
    
    return FeeReport(**report_data)


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


# Payment Export
@router.post("/payments/export")
async def export_payments(
    export_options: dict,
    school_context: SchoolContext = Depends(require_school_admin()),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Export payment data as CSV with filters"""
    from fastapi.responses import Response
    from datetime import datetime
    import csv
    import io
    
    current_school = school_context.school
    
    if not current_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    # Extract filters
    filters = export_options.get('filters', {})
    status_filter = filters.get('status')
    class_id = filters.get('class_id')
    search = filters.get('search')
    start_date = filters.get('start_date')
    end_date = filters.get('end_date')
    
    # Convert date strings if present
    if start_date:
        start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
    if end_date:
        end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
    
    # Fetch payments with filters
    from sqlalchemy import select, and_, or_
    from app.models.fee import FeePayment, FeeAssignment, FeeStructure
    from app.models.student import Student
    from app.models.academic import Class
    
    query = select(
        FeePayment,
        FeeAssignment,
        FeeStructure,
        Student,
        Class
    ).join(
        FeeAssignment, FeePayment.fee_assignment_id == FeeAssignment.id
    ).join(
        FeeStructure, FeeAssignment.fee_structure_id == FeeStructure.id
    ).join(
        Student, FeePayment.student_id == Student.id
    ).outerjoin(
        Class, Student.current_class_id == Class.id
    ).where(
        FeePayment.school_id == current_school.id,
        FeePayment.is_deleted == False
    )
    
    # Apply filters
    if status_filter:
        query = query.where(FeeAssignment.status == status_filter)
    
    if class_id:
        query = query.where(Student.current_class_id == class_id)
    
    if search:
        query = query.where(
            or_(
                Student.first_name.ilike(f"%{search}%"),
                Student.last_name.ilike(f"%{search}%"),
                Student.admission_number.ilike(f"%{search}%")
            )
        )
    
    if start_date:
        query = query.where(FeePayment.payment_date >= start_date)
    
    if end_date:
        query = query.where(FeePayment.payment_date <= end_date)
    
    result = await db.execute(query)
    records = result.all()
    
    # Generate CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        'Payment Date',
        'Receipt Number',
        'Student Name',
        'Admission Number',
        'Class',
        'Fee Type',
        'Fee Structure',
        'Amount',
        'Payment Method',
        'Status',
        'Collected By'
    ])
    
    # Write data
    for payment, assignment, structure, student, student_class in records:
        writer.writerow([
            payment.payment_date.strftime('%Y-%m-%d') if payment.payment_date else '',
            payment.receipt_number,
            f"{student.first_name} {student.last_name}",
            student.admission_number,
            student_class.name if student_class else 'N/A',
            structure.fee_type.value if structure.fee_type else 'N/A',
            structure.name,
            float(payment.amount),
            payment.payment_method.value if payment.payment_method else 'N/A',
            assignment.status.value if assignment.status else 'N/A',
            'Admin'  # You might want to join with User table to get actual collector name
        ])
    
    csv_content = output.getvalue()
    output.close()
    
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=payment_report_{datetime.now().strftime('%Y%m%d')}.csv"
        }
    )
