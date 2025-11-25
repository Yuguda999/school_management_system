from typing import Optional, List, Dict, Any
from pydantic import BaseModel, validator
from datetime import date, datetime
from decimal import Decimal
from app.models.fee import FeeType, PaymentStatus, PaymentMethod


class FeeStructureBase(BaseModel):
    name: str
    description: Optional[str] = None
    academic_session: str
    applicable_to: str = 'all'  # 'all' or 'specific_classes'
    class_ids: Optional[List[str]] = None
    fee_type: FeeType
    amount: Decimal
    is_mandatory: bool = True
    due_date: Optional[date] = None
    late_fee_amount: Decimal = Decimal('0.00')
    late_fee_days: int = 0
    allow_installments: bool = False
    installment_count: int = 1


class FeeStructureCreate(FeeStructureBase):
    metadata: Optional[Dict[str, Any]] = None


class FeeStructureUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[Decimal] = None
    is_mandatory: Optional[bool] = None
    due_date: Optional[date] = None
    late_fee_amount: Optional[Decimal] = None
    late_fee_days: Optional[int] = None
    allow_installments: Optional[bool] = None
    installment_count: Optional[int] = None
    is_active: Optional[bool] = None
    additional_data: Optional[Dict[str, Any]] = None


class FeeStructureResponse(FeeStructureBase):
    id: str
    is_active: bool
    additional_data: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class FeeAssignmentBase(BaseModel):
    student_id: str
    fee_structure_id: str
    term_id: str
    assigned_date: date
    due_date: date
    amount: Decimal
    discount_amount: Decimal = Decimal('0.00')
    discount_reason: Optional[str] = None
    notes: Optional[str] = None


class FeeAssignmentCreate(FeeAssignmentBase):
    pass


class FeeAssignmentUpdate(BaseModel):
    due_date: Optional[date] = None
    amount: Optional[Decimal] = None
    discount_amount: Optional[Decimal] = None
    discount_reason: Optional[str] = None
    notes: Optional[str] = None


from app.schemas.student import StudentResponse

class FeeAssignmentResponse(FeeAssignmentBase):
    id: str
    amount_paid: Decimal
    amount_outstanding: Decimal
    status: PaymentStatus
    late_fee_applied: Decimal
    
    # Related information
    student_name: Optional[str] = None
    student: Optional[StudentResponse] = None
    fee_structure_name: Optional[str] = None
    fee_structure: Optional[FeeStructureResponse] = None
    term_name: Optional[str] = None
    
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class FeePaymentBase(BaseModel):
    payment_date: date
    amount: Decimal
    payment_method: PaymentMethod
    transaction_reference: Optional[str] = None
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    cheque_number: Optional[str] = None
    notes: Optional[str] = None


class FeePaymentCreate(FeePaymentBase):
    student_id: str
    fee_assignment_id: str


class FeePaymentUpdate(BaseModel):
    payment_date: Optional[date] = None
    amount: Optional[Decimal] = None
    payment_method: Optional[PaymentMethod] = None
    transaction_reference: Optional[str] = None
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    cheque_number: Optional[str] = None
    notes: Optional[str] = None
    is_verified: Optional[bool] = None


class FeePaymentResponse(FeePaymentBase):
    id: str
    receipt_number: str
    student_id: str
    fee_assignment_id: str
    collected_by: str
    is_verified: bool
    verified_by: Optional[str] = None
    verified_at: Optional[date] = None
    
    # Related information
    student_name: Optional[str] = None
    student: Optional[StudentResponse] = None
    fee_assignment: Optional[FeeAssignmentResponse] = None
    collector_name: Optional[str] = None
    verifier_name: Optional[str] = None
    
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class BulkFeeAssignmentCreate(BaseModel):
    fee_structure_id: str
    term_id: str
    class_ids: List[str]  # Assign to all students in these classes
    due_date: Optional[date] = None  # Optional - will use fee structure's due_date if not provided
    discount_amount: Optional[Decimal] = Decimal('0.00')
    discount_reason: Optional[str] = None


class StudentFeesSummary(BaseModel):
    student_id: str
    student_name: str
    total_fees: Decimal
    total_paid: Decimal
    total_outstanding: Decimal
    overdue_amount: Decimal
    
    class Config:
        from_attributes = True


class FeeReport(BaseModel):
    total_expected: Decimal
    total_collected: Decimal
    total_outstanding: Decimal
    collection_percentage: float
    overdue_amount: Decimal
    
    class Config:
        from_attributes = True


class PaymentReceipt(BaseModel):
    receipt_number: str
    student_name: str
    payment_date: date
    amount: Decimal
    payment_method: PaymentMethod
    fee_details: List[Dict[str, Any]]
    school_info: Dict[str, Any]
    
    class Config:
        from_attributes = True
