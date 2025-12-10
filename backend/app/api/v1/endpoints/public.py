"""
Public endpoints that don't require authentication
"""
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.schemas.public import SchoolRegistrationRequest, SchoolRegistrationRequestResponse
from app.models.school_registration_request import SchoolRegistrationRequest as SchoolRegistrationRequestModel
from app.services.email_service import EmailService
from app.core.config import settings

router = APIRouter()


@router.post("/school-registration-request", response_model=SchoolRegistrationRequestResponse)
async def submit_school_registration_request(
    request_data: SchoolRegistrationRequest,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Submit a school registration request.
    This is a public endpoint that allows potential customers to request access.
    """
    try:
        # Check if email already exists in requests
        result = await db.execute(
            select(SchoolRegistrationRequestModel).where(
                SchoolRegistrationRequestModel.email == request_data.email
            )
        )
        existing_request = result.scalar_one_or_none()
        
        if existing_request and existing_request.status == "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A registration request with this email is already pending review"
            )
        
        # Create new registration request
        registration_request = SchoolRegistrationRequestModel(
            school_name=request_data.school_name,
            contact_person=request_data.contact_person,
            email=request_data.email,
            phone=request_data.phone,
            school_type=request_data.school_type,
            student_count_estimate=request_data.student_count_estimate,
            address=request_data.address,
            city=request_data.city,
            state=request_data.state,
            country=request_data.country,
            website=request_data.website,
            message=request_data.message,
            status="pending"
        )
        
        db.add(registration_request)
        await db.commit()
        await db.refresh(registration_request)
        
        # Send notification email to platform admin
        await send_registration_request_notification(registration_request)
        
        # Send confirmation email to requester
        await send_registration_request_confirmation(registration_request)
        
        return SchoolRegistrationRequestResponse(
            id=registration_request.id,
            message="Registration request submitted successfully. We will contact you within 24 hours.",
            status="pending"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit registration request"
        )


@router.get("/school-registration-requests/{request_id}")
async def get_registration_request_status(
    request_id: str,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get the status of a registration request.
    Public endpoint for applicants to check their request status.
    """
    result = await db.execute(
        select(SchoolRegistrationRequestModel).where(
            SchoolRegistrationRequestModel.id == request_id
        )
    )
    request = result.scalar_one_or_none()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration request not found"
        )
    
    return {
        "id": request.id,
        "school_name": request.school_name,
        "status": request.status,
        "submitted_at": request.created_at,
        "reviewed_at": request.reviewed_at,
        "notes": request.admin_notes if request.status != "pending" else None
    }


async def send_registration_request_notification(request: SchoolRegistrationRequestModel):
    """Send email notification to platform admin about new registration request"""
    try:
        subject = f"New School Registration Request - {request.school_name}"
        
        html_content = f"""
        <h2>New School Registration Request</h2>
        
        <h3>School Information:</h3>
        <ul>
            <li><strong>School Name:</strong> {request.school_name}</li>
            <li><strong>School Type:</strong> {request.school_type}</li>
            <li><strong>Estimated Students:</strong> {request.student_count_estimate}</li>
            <li><strong>Website:</strong> {request.website or 'Not provided'}</li>
        </ul>
        
        <h3>Contact Information:</h3>
        <ul>
            <li><strong>Contact Person:</strong> {request.contact_person}</li>
            <li><strong>Email:</strong> {request.email}</li>
            <li><strong>Phone:</strong> {request.phone}</li>
        </ul>
        
        <h3>Location:</h3>
        <ul>
            <li><strong>Address:</strong> {request.address}</li>
            <li><strong>City:</strong> {request.city}</li>
            <li><strong>State:</strong> {request.state}</li>
            <li><strong>Country:</strong> {request.country}</li>
        </ul>
        
        {f'<h3>Additional Message:</h3><p>{request.message}</p>' if request.message else ''}
        
        <p><strong>Request ID:</strong> {request.id}</p>
        <p><strong>Submitted:</strong> {request.created_at}</p>
        
        <p>
            <a href="{settings.frontend_url}/platform/registration-requests/{request.id}" 
               style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Review Request
            </a>
        </p>
        """
        
        await EmailService.send_email(
            to_emails=[settings.admin_email],
            subject=subject,
            html_content=html_content
        )
        
    except Exception as e:
        # Log error but don't fail the request
        print(f"Failed to send admin notification email: {e}")


async def send_registration_request_confirmation(request: SchoolRegistrationRequestModel):
    """Send confirmation email to the person who submitted the request"""
    try:
        subject = f"Registration Request Received - {request.school_name}"
        
        html_content = f"""
        <h2>Thank You for Your Interest!</h2>
        
        <p>Dear {request.contact_person},</p>
        
        <p>We have received your registration request for <strong>{request.school_name}</strong>.</p>
        
        <h3>What's Next?</h3>
        <ol>
            <li>Our team will review your application within 24 hours</li>
            <li>We may contact you for additional information if needed</li>
            <li>Once approved, you'll receive an invitation link to complete your school setup</li>
            <li>You'll then have access to our full platform with a free trial period</li>
        </ol>
        
        <h3>Request Details:</h3>
        <ul>
            <li><strong>School Name:</strong> {request.school_name}</li>
            <li><strong>School Type:</strong> {request.school_type}</li>
            <li><strong>Request ID:</strong> {request.id}</li>
            <li><strong>Submitted:</strong> {request.created_at}</li>
        </ul>
        
        <p>You can check the status of your request at any time using this link:</p>
        <p>
            <a href="{settings.frontend_url}/registration-status/{request.id}" 
               style="background-color: #10B981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Check Request Status
            </a>
        </p>
        
        <p>If you have any questions, please don't hesitate to contact our support team at {settings.support_email}.</p>
        
        <p>Best regards,<br>
        The School Management Platform Team</p>
        """
        
        await EmailService.send_email(
            to_emails=[request.email],
            subject=subject,
            html_content=html_content
        )
        
    except Exception as e:
        # Log error but don't fail the request
        print(f"Failed to send confirmation email: {e}")


@router.get("/features")
async def get_platform_features():
    """Get platform features for marketing/landing page"""
    return {
        "features": [
            {
                "title": "Student Management",
                "description": "Complete student information system with enrollment, attendance, and academic records",
                "icon": "academic-cap"
            },
            {
                "title": "Teacher Portal",
                "description": "Dedicated portal for teachers to manage classes, assignments, and student progress",
                "icon": "user-group"
            },
            {
                "title": "Fee Management",
                "description": "Automated fee collection, payment tracking, and financial reporting",
                "icon": "currency-dollar"
            },
            {
                "title": "Communication Tools",
                "description": "SMS and email notifications to keep parents and students informed",
                "icon": "chat-bubble-left-right"
            },
            {
                "title": "Reports & Analytics",
                "description": "Comprehensive reporting and analytics for data-driven decision making",
                "icon": "chart-bar"
            },
            {
                "title": "Mobile Access",
                "description": "Mobile-responsive design for access from any device, anywhere",
                "icon": "device-phone-mobile"
            }
        ],
        "pricing": {
            "starter": {
                "name": "Starter",
                "price": 29,
                "currency": "USD",
                "period": "month",
                "features": ["Up to 100 students", "Basic features", "Email support"],
                "student_limit": 100
            },
            "professional": {
                "name": "Professional",
                "price": 79,
                "currency": "USD",
                "period": "month",
                "features": ["Up to 500 students", "Advanced features", "Priority support", "Custom reports"],
                "student_limit": 500
            },
            "enterprise": {
                "name": "Enterprise",
                "price": "Custom",
                "currency": "USD",
                "period": "month",
                "features": ["Unlimited students", "All features", "Dedicated support", "Custom integrations"],
                "student_limit": null
            }
        },
        "trial": {
            "duration_days": 30,
            "features_included": "all",
            "credit_card_required": false
        }
    }


@router.get("/testimonials")
async def get_testimonials():
    """Get customer testimonials for marketing"""
    return {
        "testimonials": [
            {
                "name": "Dr. Sarah Johnson",
                "position": "Principal",
                "school": "Greenwood High School",
                "content": "This platform has transformed how we manage our school. The efficiency gains are remarkable!",
                "rating": 5,
                "image": "/images/testimonials/sarah-johnson.jpg"
            },
            {
                "name": "Michael Chen",
                "position": "Administrator",
                "school": "Riverside Academy",
                "content": "The reporting features give us insights we never had before. Highly recommended!",
                "rating": 5,
                "image": "/images/testimonials/michael-chen.jpg"
            },
            {
                "name": "Fatima Al-Rashid",
                "position": "Director",
                "school": "International School of Excellence",
                "content": "Outstanding customer support and a platform that grows with our needs.",
                "rating": 5,
                "image": "/images/testimonials/fatima-al-rashid.jpg"
            }
        ]
    }
