from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Any, Dict
import json

from app.core.deps import get_current_active_user, get_db, get_school_context
from app.models.student import Student
from app.models.school import School
from app.models.credential import VerifiableCredential, CredentialType, CredentialStatus
from app.services.blockchain_service import BlockchainService
from app.services.encryption_service import EncryptionService

router = APIRouter()
blockchain_service = BlockchainService()
encryption_service = EncryptionService()

@router.post("/issue/{student_id}", status_code=status.HTTP_200_OK)
async def issue_credential(
    student_id: str,
    credential_type: CredentialType,
    title: str,
    description: str = None,
    claims: Dict[str, Any] = {},
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
) -> Any:
    """
    Issues a Verifiable Credential for a student.
    Triggers the blockchain transaction using the School's Identity.
    """
    # 1. Fetch Student & School
    result = await db.execute(select(Student).filter(Student.id == student_id))
    student = result.scalars().first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    school_id = student.school_id
    school_result = await db.execute(select(School).filter(School.id == school_id))
    school = school_result.scalars().first()
    
    if not school or not school.blockchain_enabled or not school.encrypted_signing_key:
        raise HTTPException(status_code=400, detail="School identity not enabled. Please enable it in Settings.")

    # 2. Decrypt School Key
    try:
        signing_key_hex = encryption_service.decrypt(school.encrypted_signing_key)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to decrypt school identity key.")

    # 3. Prepare Metadata (W3C-like structure)
    # In a real app, we would use a proper DID for the student. 
    # For now, we use a hash of their private record as the 'id'.
    record_data = f"{student.full_name}|{student.admission_number}|{student.date_of_birth}"
    record_hash = blockchain_service.hash_student_record(record_data)
    
    # Helper to remove None/null values and truncate strings to 64 bytes (Cardano limit)
    def sanitize_for_cardano(value, max_str_len=64):
        if value is None:
            return None
        if isinstance(value, str):
            # Truncate to 64 bytes (Cardano metadata string limit)
            encoded = value.encode('utf-8')
            if len(encoded) > max_str_len:
                return encoded[:max_str_len].decode('utf-8', errors='ignore')
            return value
        if isinstance(value, dict):
            result = {}
            for k, v in value.items():
                sanitized = sanitize_for_cardano(v, max_str_len)
                if sanitized is not None:
                    # Keys must also be <= 64 bytes
                    key = str(k)[:64]
                    result[key] = sanitized
            return result
        if isinstance(value, list):
            return [sanitize_for_cardano(v, max_str_len) for v in value if sanitize_for_cardano(v, max_str_len) is not None]
        if isinstance(value, (int, float, bool)):
            return value
        # Convert other types to string
        return str(value)[:max_str_len]
    
    # Use shorter keys and truncated values for Cardano compatibility
    vc_metadata = {
        "name": title[:64] if title else "Credential",
        "type": credential_type.value,
        "issuer": school.code[:64],
        "subject": {
            "id": record_hash[:32],  # Use first 32 chars of hash
            "name": (student.full_name or "")[:64],
        }
    }
    
    # Only add description if provided (truncated)
    if description:
        vc_metadata["desc"] = description[:64]
    
    # Final sanitization
    vc_metadata = sanitize_for_cardano(vc_metadata)

    # 4. Mint on Blockchain
    try:
        tx_result = blockchain_service.issue_credential(
            signing_key_hex=signing_key_hex,
            student_admission_number=student.admission_number,
            credential_metadata=vc_metadata
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Blockchain issuance failed: {str(e)}")

    # 5. Save to Database
    credential = VerifiableCredential(
        student_id=student.id,
        school_id=school.id,
        credential_type=credential_type,
        title=title,
        description=description,
        policy_id=tx_result["policy_id"],
        asset_name=tx_result["asset_name"],
        transaction_hash=tx_result["tx_hash"],
        record_hash=record_hash,
        metadata_json=json.dumps(vc_metadata),
        status=CredentialStatus.MINTED
    )
    
    db.add(credential)
    await db.commit()
    await db.refresh(credential)
    
    # Return serializable dictionary
    return {
        "id": str(credential.id),
        "student_id": str(credential.student_id),
        "school_id": str(credential.school_id),
        "credential_type": credential.credential_type.value if credential.credential_type else None,
        "title": credential.title,
        "description": credential.description,
        "policy_id": credential.policy_id,
        "asset_name": credential.asset_name,
        "transaction_hash": credential.transaction_hash,
        "status": credential.status.value if credential.status else None,
        "created_at": credential.created_at.isoformat() if credential.created_at else None
    }

@router.get("/me", status_code=status.HTTP_200_OK)
async def get_my_credentials(
    db: AsyncSession = Depends(get_db),
    school_context = Depends(get_school_context)
) -> Any:
    """
    Get credentials for the currently authenticated student.
    Works for both:
    1. Students logged in directly (school_context.user IS the Student)
    2. Users with STUDENT role (need to look up by user_id)
    """
    from app.models.user import UserRole
    
    student = None
    user = school_context.user
    
    # Check if the user IS already a Student object
    if hasattr(user, 'admission_number'):
        # This is a Student object directly
        student = user
    elif hasattr(user, 'role') and user.role == UserRole.STUDENT:
        # This is a User with STUDENT role, look up the student record
        result = await db.execute(
            select(Student).filter(Student.user_id == user.id)
        )
        student = result.scalars().first()
    
    if not student:
        # Return empty list if not a student
        return []
    
    # Get credentials for this student
    cred_result = await db.execute(
        select(VerifiableCredential)
        .filter(VerifiableCredential.student_id == student.id)
        .order_by(VerifiableCredential.created_at.desc())
    )
    credentials = cred_result.scalars().all()
    
    return [
        {
            "id": str(c.id),
            "student_id": str(c.student_id),
            "school_id": str(c.school_id),
            "credential_type": c.credential_type.value if c.credential_type else None,
            "title": c.title,
            "description": c.description,
            "policy_id": c.policy_id,
            "asset_name": c.asset_name,
            "transaction_hash": c.transaction_hash,
            "status": c.status.value if c.status else None,
            "created_at": c.created_at.isoformat() if c.created_at else None
        }
        for c in credentials
    ]

@router.get("/student/{student_id}", status_code=status.HTTP_200_OK)
async def get_student_credentials(
    student_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
) -> Any:
    """
    Get all Verifiable Credentials for a specific student.
    """
    # Verify permissions (student themselves, parent, or school staff)
    # TODO: Add strict permission check
    
    result = await db.execute(
        select(VerifiableCredential)
        .filter(VerifiableCredential.student_id == student_id)
        .order_by(VerifiableCredential.created_at.desc())
    )
    credentials = result.scalars().all()
    
    # Return serializable list
    return [
        {
            "id": str(c.id),
            "student_id": str(c.student_id),
            "school_id": str(c.school_id),
            "credential_type": c.credential_type.value if c.credential_type else None,
            "title": c.title,
            "description": c.description,
            "policy_id": c.policy_id,
            "asset_name": c.asset_name,
            "transaction_hash": c.transaction_hash,
            "status": c.status.value if c.status else None,
            "created_at": c.created_at.isoformat() if c.created_at else None
        }
        for c in credentials
    ]


@router.get("/verify/{asset_id}", status_code=status.HTTP_200_OK)
async def verify_credential(
    asset_id: str,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Public endpoint to verify a credential by its asset ID or transaction hash.
    Does not require authentication.
    """
    # Try finding by transaction hash first
    result = await db.execute(
        select(VerifiableCredential).filter(
            (VerifiableCredential.transaction_hash == asset_id) |
            (VerifiableCredential.policy_id + VerifiableCredential.asset_name == asset_id) |
            (VerifiableCredential.asset_name == asset_id)
        )
    )
    credential = result.scalars().first()
    
    if not credential:
        return {
            "valid": False,
            "error": "Credential not found"
        }
    
    # Get school info for issuer name
    school_result = await db.execute(select(School).filter(School.id == credential.school_id))
    school = school_result.scalars().first()
    
    # Get student info (minimal)
    student_result = await db.execute(select(Student).filter(Student.id == credential.student_id))
    student = student_result.scalars().first()
    
    return {
        "valid": credential.status == CredentialStatus.MINTED,
        "credential": {
            "id": credential.id,
            "title": credential.title,
            "credential_type": credential.credential_type.value if credential.credential_type else "UNKNOWN",
            "description": credential.description,
            "status": credential.status.value if credential.status else "UNKNOWN",
            "transaction_hash": credential.transaction_hash,
            "created_at": credential.created_at.isoformat() if credential.created_at else None,
            "issuer_name": school.name if school else "Unknown School",
            "subject_name": student.full_name if student else "Unknown Student"
        },
        "onChainData": {
            "policy_id": credential.policy_id,
            "asset_name": credential.asset_name
        }
    }

