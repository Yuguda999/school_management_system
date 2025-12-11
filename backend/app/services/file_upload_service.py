import os
import uuid
import aiofiles
import logging
from typing import Optional
from fastapi import HTTPException, UploadFile, status
from PIL import Image
import io
from app.core.config import settings

logger = logging.getLogger(__name__)


class FileUploadService:
    """Service for handling file uploads - supports both local and Cloudinary storage"""
    
    ALLOWED_IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.gif', '.webp'}
    MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB
    LOGO_MAX_DIMENSIONS = (500, 500)  # Max width/height for logos
    PROFILE_MAX_DIMENSIONS = (200, 200)  # Max width/height for profile pictures
    
    _cloudinary_configured = False
    
    @classmethod
    def _configure_cloudinary(cls) -> bool:
        """Configure Cloudinary if credentials are available"""
        if cls._cloudinary_configured:
            return True
            
        if settings.cloudinary_cloud_name and settings.cloudinary_api_key and settings.cloudinary_api_secret:
            try:
                import cloudinary
                cloudinary.config(
                    cloud_name=settings.cloudinary_cloud_name,
                    api_key=settings.cloudinary_api_key,
                    api_secret=settings.cloudinary_api_secret,
                    secure=True
                )
                cls._cloudinary_configured = True
                logger.info("Cloudinary configured successfully")
                return True
            except Exception as e:
                logger.error(f"Failed to configure Cloudinary: {str(e)}")
                return False
        return False
    
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
    async def _upload_to_cloudinary(content: bytes, folder: str, public_id: str) -> str:
        """Upload image to Cloudinary and return URL"""
        import cloudinary.uploader
        
        try:
            result = cloudinary.uploader.upload(
                content,
                folder=folder,
                public_id=public_id,
                overwrite=True,
                resource_type="image",
                transformation=[
                    {"quality": "auto:good"},
                    {"fetch_format": "auto"}
                ]
            )
            logger.info(f"Image uploaded to Cloudinary: {result['secure_url']}")
            return result['secure_url']
        except Exception as e:
            logger.error(f"Failed to upload to Cloudinary: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload image to cloud storage: {str(e)}"
            )
    
    @staticmethod
    async def _delete_from_cloudinary(public_id: str) -> None:
        """Delete image from Cloudinary"""
        import cloudinary.uploader
        
        try:
            result = cloudinary.uploader.destroy(public_id, resource_type="image")
            logger.info(f"Image deleted from Cloudinary: {public_id}, result: {result}")
        except Exception as e:
            logger.error(f"Failed to delete from Cloudinary: {str(e)}")
            # Don't raise exception for delete failures
    
    @staticmethod
    async def upload_school_logo(file: UploadFile, school_id: str) -> str:
        """Upload and process school logo - uses Cloudinary if configured, otherwise local storage"""
        # Validate file
        FileUploadService._validate_image_file(file)
        
        # Read and process file content
        content = await file.read()
        processed_content = await FileUploadService._resize_image(
            content, FileUploadService.LOGO_MAX_DIMENSIONS
        )
        
        # Check if Cloudinary is configured
        if FileUploadService._configure_cloudinary():
            # Upload to Cloudinary
            public_id = f"school_logo_{school_id}"
            return await FileUploadService._upload_to_cloudinary(
                processed_content,
                folder="school_logos",
                public_id=public_id
            )
        else:
            # Fall back to local storage
            upload_dir = os.path.join(settings.upload_dir, "school_logos")
            FileUploadService._ensure_upload_directory(upload_dir)
            
            ext = FileUploadService._get_file_extension(file.filename)
            filename = f"{school_id}_{uuid.uuid4().hex}{ext}"
            file_path = os.path.join(upload_dir, filename)
            
            try:
                async with aiofiles.open(file_path, 'wb') as f:
                    await f.write(processed_content)
                return f"/uploads/school_logos/{filename}"
            except Exception as e:
                if os.path.exists(file_path):
                    os.remove(file_path)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to upload file: {str(e)}"
                )
    
    @staticmethod
    async def delete_school_logo(logo_url: str) -> None:
        """Delete school logo - handles both Cloudinary and local storage"""
        if not logo_url:
            return
        
        # Check if it's a Cloudinary URL
        if "cloudinary.com" in logo_url or "res.cloudinary.com" in logo_url:
            # Extract public_id from Cloudinary URL
            # URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{folder}/{public_id}.{ext}
            try:
                parts = logo_url.split("/")
                # Get folder/filename part
                if "school_logos" in parts:
                    idx = parts.index("school_logos")
                    public_id_with_ext = parts[idx + 1] if idx + 1 < len(parts) else None
                    if public_id_with_ext:
                        public_id = f"school_logos/{os.path.splitext(public_id_with_ext)[0]}"
                        await FileUploadService._delete_from_cloudinary(public_id)
            except Exception as e:
                logger.error(f"Failed to parse Cloudinary URL for deletion: {str(e)}")
        elif logo_url.startswith("/uploads/school_logos/"):
            # Local file
            filename = os.path.basename(logo_url)
            file_path = os.path.join(settings.upload_dir, "school_logos", filename)
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except Exception:
                    pass
    
    @staticmethod
    async def upload_profile_picture(file: UploadFile, user_id: str) -> str:
        """Upload and process profile picture - uses Cloudinary if configured, otherwise local storage"""
        # Validate file
        FileUploadService._validate_image_file(file)
        
        # Read and process file content
        content = await file.read()
        processed_content = await FileUploadService._resize_image(
            content, FileUploadService.PROFILE_MAX_DIMENSIONS
        )
        
        # Check if Cloudinary is configured
        if FileUploadService._configure_cloudinary():
            # Upload to Cloudinary
            public_id = f"profile_{user_id}"
            return await FileUploadService._upload_to_cloudinary(
                processed_content,
                folder="profile_pictures",
                public_id=public_id
            )
        else:
            # Fall back to local storage
            upload_dir = os.path.join(settings.upload_dir, "profile_pictures")
            FileUploadService._ensure_upload_directory(upload_dir)
            
            ext = FileUploadService._get_file_extension(file.filename)
            filename = f"{user_id}_{uuid.uuid4().hex}{ext}"
            file_path = os.path.join(upload_dir, filename)
            
            try:
                async with aiofiles.open(file_path, 'wb') as f:
                    await f.write(processed_content)
                return f"/uploads/profile_pictures/{filename}"
            except Exception as e:
                if os.path.exists(file_path):
                    os.remove(file_path)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to upload file: {str(e)}"
                )

    @staticmethod
    async def delete_profile_picture(picture_url: str) -> None:
        """Delete profile picture - handles both Cloudinary and local storage"""
        if not picture_url:
            return
        
        # Check if it's a Cloudinary URL
        if "cloudinary.com" in picture_url or "res.cloudinary.com" in picture_url:
            try:
                parts = picture_url.split("/")
                if "profile_pictures" in parts:
                    idx = parts.index("profile_pictures")
                    public_id_with_ext = parts[idx + 1] if idx + 1 < len(parts) else None
                    if public_id_with_ext:
                        public_id = f"profile_pictures/{os.path.splitext(public_id_with_ext)[0]}"
                        await FileUploadService._delete_from_cloudinary(public_id)
            except Exception as e:
                logger.error(f"Failed to parse Cloudinary URL for deletion: {str(e)}")
        elif picture_url.startswith("/uploads/profile_pictures/"):
            filename = os.path.basename(picture_url)
            file_path = os.path.join(settings.upload_dir, "profile_pictures", filename)
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except Exception:
                    pass
