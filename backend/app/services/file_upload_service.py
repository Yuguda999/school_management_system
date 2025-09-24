import os
import uuid
import aiofiles
from typing import Optional
from fastapi import HTTPException, UploadFile, status
from PIL import Image
import io
from app.core.config import settings


class FileUploadService:
    """Service for handling file uploads"""
    
    ALLOWED_IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.gif', '.webp'}
    MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB
    LOGO_MAX_DIMENSIONS = (500, 500)  # Max width/height for logos
    
    @staticmethod
    def _ensure_upload_directory(directory: str) -> None:
        """Ensure upload directory exists"""
        os.makedirs(directory, exist_ok=True)
    
    @staticmethod
    def _get_file_extension(filename: str) -> str:
        """Get file extension from filename"""
        return os.path.splitext(filename)[1].lower()
    
    @staticmethod
    def _validate_image_file(file: UploadFile) -> None:
        """Validate image file"""
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No filename provided"
            )
        
        # Check file extension
        ext = FileUploadService._get_file_extension(file.filename)
        if ext not in FileUploadService.ALLOWED_IMAGE_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type. Allowed types: {', '.join(FileUploadService.ALLOWED_IMAGE_EXTENSIONS)}"
            )
        
        # Check file size
        if file.size and file.size > FileUploadService.MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large. Maximum size: {FileUploadService.MAX_IMAGE_SIZE // (1024*1024)}MB"
            )
    
    @staticmethod
    async def _resize_image(image_data: bytes, max_dimensions: tuple[int, int]) -> bytes:
        """Resize image if it exceeds max dimensions"""
        try:
            # Open image
            image = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB if necessary (for PNG with transparency)
            if image.mode in ('RGBA', 'LA', 'P'):
                # Create white background
                background = Image.new('RGB', image.size, (255, 255, 255))
                if image.mode == 'P':
                    image = image.convert('RGBA')
                background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
                image = background
            
            # Resize if needed
            if image.size[0] > max_dimensions[0] or image.size[1] > max_dimensions[1]:
                image.thumbnail(max_dimensions, Image.Resampling.LANCZOS)
            
            # Save to bytes
            output = io.BytesIO()
            image.save(output, format='PNG', optimize=True)
            return output.getvalue()
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid image file: {str(e)}"
            )
    
    @staticmethod
    async def upload_school_logo(file: UploadFile, school_id: str) -> str:
        """Upload and process school logo"""
        # Validate file
        FileUploadService._validate_image_file(file)
        
        # Create upload directory
        upload_dir = os.path.join(settings.upload_dir, "school_logos")
        FileUploadService._ensure_upload_directory(upload_dir)
        
        # Generate unique filename
        ext = FileUploadService._get_file_extension(file.filename)
        filename = f"{school_id}_{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(upload_dir, filename)
        
        try:
            # Read file content
            content = await file.read()
            
            # Resize image if needed
            processed_content = await FileUploadService._resize_image(
                content, FileUploadService.LOGO_MAX_DIMENSIONS
            )
            
            # Save file
            async with aiofiles.open(file_path, 'wb') as f:
                await f.write(processed_content)
            
            # Return relative URL
            return f"/uploads/school_logos/{filename}"
            
        except Exception as e:
            # Clean up file if it was created
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload file: {str(e)}"
            )
    
    @staticmethod
    async def delete_school_logo(logo_url: str) -> None:
        """Delete school logo file"""
        if not logo_url or not logo_url.startswith("/uploads/school_logos/"):
            return
        
        # Extract filename from URL
        filename = os.path.basename(logo_url)
        file_path = os.path.join(settings.upload_dir, "school_logos", filename)
        
        # Delete file if it exists
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                # Ignore deletion errors
                pass
    
    @staticmethod
    async def upload_profile_picture(file: UploadFile, user_id: str) -> str:
        """Upload and process profile picture"""
        # Validate file
        FileUploadService._validate_image_file(file)
        
        # Create upload directory
        upload_dir = os.path.join(settings.upload_dir, "profile_pictures")
        FileUploadService._ensure_upload_directory(upload_dir)
        
        # Generate unique filename
        ext = FileUploadService._get_file_extension(file.filename)
        filename = f"{user_id}_{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(upload_dir, filename)
        
        try:
            # Read file content
            content = await file.read()
            
            # Resize image (smaller for profile pictures)
            processed_content = await FileUploadService._resize_image(
                content, (200, 200)
            )
            
            # Save file
            async with aiofiles.open(file_path, 'wb') as f:
                await f.write(processed_content)
            
            # Return relative URL
            return f"/uploads/profile_pictures/{filename}"
            
        except Exception as e:
            # Clean up file if it was created
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload file: {str(e)}"
            )
