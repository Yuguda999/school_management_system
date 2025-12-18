from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Any
from pycardano import PaymentSigningKey, PaymentVerificationKey, Address, Network

from app.core.deps import get_current_active_user, get_db
from app.models.school import School
from app.services.encryption_service import EncryptionService
from app.services.blockchain_service import BlockchainService
from app.core.config import settings

router = APIRouter()
encryption_service = EncryptionService()
blockchain_service = BlockchainService()

@router.post("/{school_id}/identity/enable", status_code=status.HTTP_200_OK)
async def enable_school_identity(
    school_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
) -> Any:
    """
    Enables sovereign identity for a school by generating a unique Cardano wallet.
    This wallet acts as the Issuer DID for Verifiable Credentials.
    """
    # Verify user permissions (must be school admin/owner)
    # TODO: Add strict permission check here
    
    result = await db.execute(select(School).filter(School.id == school_id))
    school = result.scalars().first()
    
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
        
    if school.blockchain_enabled:
        return {
            "message": "School identity already enabled",
            "wallet_address": school.wallet_address
        }

    # Generate new wallet (Identity)
    signing_key = PaymentSigningKey.generate()
    verification_key = PaymentVerificationKey.from_signing_key(signing_key)
    
    # Determine network
    network = Network.TESTNET if settings.cardano_network.lower() != "mainnet" else Network.MAINNET
    address = Address(verification_key.hash(), network=network)
    
    # Encrypt private key
    signing_key_hex = signing_key.to_cbor().hex()
    try:
        encrypted_key = encryption_service.encrypt(signing_key_hex)
    except ValueError as e:
         raise HTTPException(status_code=500, detail=str(e))
    
    # Update School
    school.wallet_address = str(address)
    school.encrypted_signing_key = encrypted_key
    school.blockchain_enabled = True
    
    db.add(school)
    await db.commit()
    await db.refresh(school)
    
    return {
        "message": "School identity enabled successfully",
        "wallet_address": school.wallet_address,
        "network": settings.cardano_network
    }

@router.get("/{school_id}/identity/status")
async def get_identity_status(
    school_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
) -> Any:
    """
    Returns the identity status and wallet balance for a school.
    """
    result = await db.execute(select(School).filter(School.id == school_id))
    school = result.scalars().first()
    
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
        
    balance = 0.0
    if school.blockchain_enabled and school.wallet_address:
        balance = blockchain_service.get_balance(school.wallet_address)
        
    return {
        "enabled": school.blockchain_enabled,
        "wallet_address": school.wallet_address,
        "balance": balance,
        "network": settings.cardano_network
    }
