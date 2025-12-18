from sqlalchemy import Column, String, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.models.base import TenantBaseModel
import enum

class CertificateStatus(str, enum.Enum):
    PENDING = "PENDING"
    MINTED = "MINTED"
    FAILED = "FAILED"

class TransferCertificate(TenantBaseModel):
    __tablename__ = "transfer_certificates"

    student_id = Column(String(36), ForeignKey("students.id"), nullable=False)
    policy_id = Column(String(64), nullable=True) # Policy ID of the minting policy
    asset_name = Column(String(64), nullable=True) # Hex encoded asset name
    transaction_hash = Column(String(64), nullable=True) # Tx hash on Cardano
    record_hash = Column(String(64), nullable=False) # SHA256 hash of the student record
    status = Column(Enum(CertificateStatus), default=CertificateStatus.PENDING, nullable=False)
    metadata_json = Column(Text, nullable=True) # Store the full metadata for reference

    # Relationships
    student = relationship("Student", back_populates="certificates")
