from sqlalchemy import Column, String, Boolean, Enum, ForeignKey, Text, Date, Numeric, JSON, Integer
from sqlalchemy.orm import relationship
from app.models.base import TenantBaseModel
import enum


class FeeType(str, enum.Enum):
    TUITION = "tuition"
    REGISTRATION = "registration"
    EXAMINATION = "examination"
    LIBRARY = "library"
    LABORATORY = "laboratory"
    SPORTS = "sports"
    TRANSPORT = "transport"
    UNIFORM = "uniform"
    BOOKS = "books"
    FEEDING = "feeding"
    DEVELOPMENT = "development"
    OTHER = "other"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PARTIAL = "partial"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    BANK_TRANSFER = "bank_transfer"
    CARD = "card"
    MOBILE_MONEY = "mobile_money"
    CHEQUE = "cheque"
    ONLINE = "online"


class FeeStructure(TenantBaseModel):
    """Fee structure template for different classes/levels"""
    
    __tablename__ = "fee_structures"
    
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    
    # Academic details
    academic_session = Column(String(20), nullable=False)
    applicable_to = Column(String(20), nullable=False, default='all')  # 'all' or 'specific_classes'
    class_ids = Column(JSON, nullable=True)  # List of class IDs when applicable_to is 'specific_classes'
    
    # Fee details
    fee_type = Column(Enum(FeeType), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    
    # Payment configuration
    is_mandatory = Column(Boolean, default=True, nullable=False)
    due_date = Column(Date, nullable=True)
    late_fee_amount = Column(Numeric(10, 2), default=0, nullable=False)
    late_fee_days = Column(Integer, default=0, nullable=False)
    
    # Installment configuration
    allow_installments = Column(Boolean, default=False, nullable=False)
    installment_count = Column(Integer, default=1, nullable=False)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Additional configuration
    additional_data = Column(JSON, nullable=True, default={})
    
    # Foreign Keys
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=False)
    
    # Relationships
    school = relationship("School", back_populates="fee_structures")
    fee_assignments = relationship("FeeAssignment", back_populates="fee_structure")
    
    def __repr__(self):
        return f"<FeeStructure(id={self.id}, name={self.name}, type={self.fee_type}, amount={self.amount})>"


class FeeAssignment(TenantBaseModel):
    """Assignment of fee structure to specific students"""
    
    __tablename__ = "fee_assignments"
    
    # Foreign Keys
    student_id = Column(String(36), ForeignKey("students.id"), nullable=False)
    fee_structure_id = Column(String(36), ForeignKey("fee_structures.id"), nullable=False)
    term_id = Column(String(36), ForeignKey("terms.id"), nullable=False)
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=False)
    
    # Assignment details
    assigned_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)  # Can be different from structure amount
    
    # Payment tracking
    amount_paid = Column(Numeric(10, 2), default=0, nullable=False)
    amount_outstanding = Column(Numeric(10, 2), nullable=False)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
    
    # Late fee tracking
    late_fee_applied = Column(Numeric(10, 2), default=0, nullable=False)
    
    # Additional information
    notes = Column(Text, nullable=True)
    discount_amount = Column(Numeric(10, 2), default=0, nullable=False)
    discount_reason = Column(String(255), nullable=True)
    
    # Relationships
    student = relationship("Student", back_populates="fee_assignments")
    fee_structure = relationship("FeeStructure", back_populates="fee_assignments")
    term = relationship("Term")
    payments = relationship("FeePayment", back_populates="fee_assignment")
    
    def __repr__(self):
        return f"<FeeAssignment(student_id={self.student_id}, amount={self.amount}, status={self.status})>"


class FeePayment(TenantBaseModel):
    """Individual fee payments made by students"""
    
    __tablename__ = "fee_payments"
    
    # Payment details
    payment_date = Column(Date, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    payment_method = Column(Enum(PaymentMethod), nullable=False)
    
    # Transaction details
    transaction_reference = Column(String(100), nullable=True, unique=True)
    receipt_number = Column(String(50), nullable=False, unique=True)
    
    # Bank/Payment details
    bank_name = Column(String(100), nullable=True)
    account_number = Column(String(50), nullable=True)
    cheque_number = Column(String(50), nullable=True)
    
    # Foreign Keys
    student_id = Column(String(36), ForeignKey("students.id"), nullable=False)
    fee_assignment_id = Column(String(36), ForeignKey("fee_assignments.id"), nullable=False)
    collected_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    school_id = Column(String(36), ForeignKey("schools.id"), nullable=False)
    
    # Additional information
    notes = Column(Text, nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    verified_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    verified_at = Column(Date, nullable=True)
    
    # Relationships
    student = relationship("Student", back_populates="fee_payments")
    fee_assignment = relationship("FeeAssignment", back_populates="payments")
    collector = relationship("User", foreign_keys=[collected_by])
    verifier = relationship("User", foreign_keys=[verified_by])
    
    def __repr__(self):
        return f"<FeePayment(id={self.id}, amount={self.amount}, receipt={self.receipt_number})>"
