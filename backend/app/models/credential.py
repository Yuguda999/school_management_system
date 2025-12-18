from sqlalchemy import Column, String, Text, Enum, ForeignKey
from sqlalchemy.orm import relationship
import enum

from app.models.base import TenantBaseModel

class CredentialType(str, enum.Enum):
    TRANSFER = "TRANSFER"
    GRADE = "GRADE"
    ATTENDANCE = "ATTENDANCE"
    ACHIEVEMENT = "ACHIEVEMENT"

class CredentialStatus(str, enum.Enum):
    PENDING = "PENDING"
    MINTED = "MINTED"
    FAILED = "FAILED"
    REVOKED = "REVOKED"

class VerifiableCredential(TenantBaseModel):
    __tablename__ = "verifiable_credentials"

    student_id = Column(String(36), ForeignKey("students.id"), nullable=False)
    
    # Credential Details
    credential_type = Column(Enum(CredentialType), nullable=False)
    title = Column(String(255), nullable=False) # e.g. "SSCE Mathematics Result"
    description = Column(Text, nullable=True)
    
    # Blockchain Details
    policy_id = Column(String(64), nullable=True) # Policy ID of the minting policy
    asset_name = Column(String(64), nullable=True) # Hex encoded asset name
    transaction_hash = Column(String(64), nullable=True) # Tx hash on Cardano
    
    # Verification Data
    record_hash = Column(String(64), nullable=False) # SHA256 hash of the private data
    metadata_json = Column(Text, nullable=True) # Store the full metadata for reference
    
    status = Column(Enum(CredentialStatus), default=CredentialStatus.PENDING, nullable=False)

    # Relationships
    student = relationship("Student", back_populates="credentials")
