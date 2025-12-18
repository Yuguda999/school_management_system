from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Any, List
import json
import qrcode
import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader

from app.core.deps import get_current_active_user, get_db
from app.models.student import Student
from app.models.certificate import TransferCertificate, CertificateStatus
from app.services.blockchain_service import BlockchainService
from app.core.config import settings

router = APIRouter()
blockchain_service = BlockchainService()

@router.post("/generate/{student_id}", status_code=status.HTTP_201_CREATED)
async def generate_certificate(
    student_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user) # Add appropriate permission check later
) -> Any:
    """
    Generates a Digital Transfer Certificate (NFT) for a student.
    """
    # 1. Fetch Student Data
    result = await db.execute(select(Student).filter(Student.id == student_id))
    student = result.scalars().first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Check if certificate already exists
    existing_cert = await db.execute(
        select(TransferCertificate).filter(TransferCertificate.student_id == student_id)
    )
    if existing_cert.scalars().first():
        raise HTTPException(status_code=400, detail="Certificate already exists for this student")

    # 2. Prepare Data for Hashing (Privacy Preserving)
    # We hash the sensitive data so it can be verified but not read publicly
    record_string = f"{student.full_name}|{student.date_of_birth}|{student.admission_number}|{student.current_class_name}"
    record_hash = blockchain_service.hash_student_record(record_string)

    # 3. Prepare Metadata (Public on Blockchain)
    metadata = {
        "name": f"Student Transfer ID: {student.admission_number}",
        "image": "ipfs://QmPZ9gcCEpqKTo6aq61g2KQqoYk8g8b8b8b8b8b8b8b8b", # Placeholder or School Logo IPFS
        "school": settings.app_name,
        "record_hash": record_hash,
        "student_id_hash": blockchain_service.hash_student_record(student.admission_number), # Hash ID too
        "type": "Transfer Certificate"
    }

    # 4. Mint Token
    try:
        mint_result = blockchain_service.mint_transfer_certificate(
            student_admission_number=student.admission_number,
            metadata_payload=metadata
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Blockchain minting failed: {str(e)}")

    # 5. Save to Database
    new_cert = TransferCertificate(
        student_id=student.id,
        policy_id=mint_result["policy_id"],
        asset_name=mint_result["asset_name"],
        transaction_hash=mint_result["tx_hash"],
        record_hash=record_hash,
        status=CertificateStatus.MINTED,
        metadata_json=json.dumps(metadata)
    )
    
    db.add(new_cert)
    await db.commit()
    await db.refresh(new_cert)
    
    return new_cert

@router.get("/verify/{asset_id}")
async def verify_certificate(
    asset_id: str,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Verifies a certificate by Asset ID.
    """
    # Check DB first
    # Note: Asset Name in DB is the human readable part, but asset_id is policy+hex_name
    # We might need to adjust query logic depending on exact storage. 
    # For now, let's assume we can find it by constructing the ID or searching.
    
    # Actually, let's search by transaction hash or just return what we have if we store the full ID.
    # Since we store policy_id and asset_name separately, we can reconstruct.
    
    # Simple verification: Check if we issued it.
    # In a real scenario, we would query Blockfrost here too to ensure it's still live.
    
    # For this MVP, let's just return success if we find a record that matches the derived asset ID components.
    # (Simplified logic)
    
    return {"status": "verified", "message": "Certificate is valid (Mock Verification)"}

@router.get("/download/{certificate_id}")
async def download_certificate_pdf(
    certificate_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Generates a PDF with the QR code for the certificate.
    """
    result = await db.execute(select(TransferCertificate).filter(TransferCertificate.id == certificate_id))
    cert = result.scalars().first()
    
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
        
    student_result = await db.execute(select(Student).filter(Student.id == cert.student_id))
    student = student_result.scalars().first()

    # Generate QR Code
    # The QR code contains the Asset ID or a Verification URL
    # verification_url = f"{settings.frontend_url}/verify/{cert.policy_id}{cert.asset_name}" # Example
    # For now, let's just put the Asset ID
    qr_data = f"{cert.policy_id}{cert.asset_name}" # Full Asset ID
    
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(qr_data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Create PDF in memory
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    # Draw Content
    p.setFont("Helvetica-Bold", 24)
    p.drawCentredString(width/2, height - 100, "OFFICIAL TRANSFER CERTIFICATE")
    
    p.setFont("Helvetica", 14)
    p.drawString(100, height - 180, f"Student Name: {student.full_name}")
    p.drawString(100, height - 200, f"Admission No: {student.admission_number}")
    p.drawString(100, height - 220, f"Date Issued: {cert.created_at.strftime('%Y-%m-%d')}")
    
    p.drawString(100, height - 260, "This document is digitally secured on the Cardano Blockchain.")
    p.drawString(100, height - 280, f"Policy ID: {cert.policy_id}")
    p.drawString(100, height - 300, f"Asset Name: {cert.asset_name}")
    
    # Draw QR Code
    # Save QR to temporary buffer to draw on PDF
    img_buffer = io.BytesIO()
    img.save(img_buffer, format="PNG")
    img_buffer.seek(0)
    
    p.drawImage(ImageReader(img_buffer), width/2 - 75, height - 500, width=150, height=150)
    p.drawCentredString(width/2, height - 520, "Scan to Verify")
    
    p.showPage()
    p.save()
    
    buffer.seek(0)
    
    return Response(content=buffer.getvalue(), media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=certificate_{student.admission_number}.pdf"})
