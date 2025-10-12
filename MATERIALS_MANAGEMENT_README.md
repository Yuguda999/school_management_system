# Teacher Materials Management System

## Overview

A comprehensive materials management system for teachers in the school management platform. This feature allows teachers to upload, organize, manage, and share educational materials (documents, PDFs, images, videos, presentations, etc.) with students and other teachers.

## Features Implemented

### ✅ Core Functionality
- **File Upload**: Single and bulk upload with drag-and-drop support
- **File Management**: CRUD operations for materials
- **Categorization**: By subject, grade level, topic, and custom tags
- **Version Control**: Track revisions and create new versions
- **Search & Filter**: Advanced filtering by multiple criteria
- **Favorites**: Mark materials as favorites for quick access

### ✅ Sharing & Distribution
- **Multiple Share Types**:
  - All Students
  - Specific Class
  - Individual Student
  - Other Teachers
  - Public
- **Permission Controls**: View and download permissions
- **Expiration Support**: Set expiration dates for shared materials
- **Bulk Sharing**: Share multiple materials at once

### ✅ Organization
- **Folder Management**: Create hierarchical folder structures
- **Drag & Drop**: Organize materials into folders
- **Custom Colors & Icons**: Personalize folders

### ✅ Analytics & Tracking
- **Access Tracking**: Track views, downloads, and previews
- **Statistics Dashboard**: 
  - Total materials count
  - Published vs draft materials
  - Storage usage
  - Materials by type and subject
  - Popular materials
  - Recent uploads
- **Storage Quota Management**: 5GB per teacher with visual indicators

### ✅ Publishing Controls
- **Draft Mode**: Save materials as drafts
- **Scheduled Publishing**: Schedule materials for future publication
- **Version History**: View and manage all versions

## Technical Implementation

### Backend (FastAPI + SQLAlchemy)

#### Database Models
- **TeacherMaterial**: Main model for educational materials
- **MaterialShare**: Sharing and distribution
- **MaterialAccess**: Access tracking and analytics
- **MaterialFolder**: Folder organization
- **MaterialFolderItem**: Junction table for folder contents

#### API Endpoints (25+ endpoints)

**Material CRUD:**
- `POST /api/v1/materials/upload` - Upload single material
- `POST /api/v1/materials/bulk-upload` - Bulk upload
- `GET /api/v1/materials/` - List materials with filtering
- `GET /api/v1/materials/{id}` - Get material details
- `PUT /api/v1/materials/{id}` - Update material
- `DELETE /api/v1/materials/{id}` - Delete material
- `GET /api/v1/materials/{id}/download` - Download material
- `GET /api/v1/materials/{id}/preview` - Preview material

**Version Control:**
- `POST /api/v1/materials/{id}/versions` - Create new version
- `GET /api/v1/materials/{id}/versions` - Get version history

**Sharing:**
- `POST /api/v1/materials/{id}/share` - Share material
- `POST /api/v1/materials/bulk-share` - Bulk share
- `GET /api/v1/materials/{id}/shares` - Get shares
- `DELETE /api/v1/materials/{id}/shares/{share_id}` - Remove share
- `GET /api/v1/materials/shared/student` - Get shared materials (students)

**Folder Management:**
- `POST /api/v1/materials/folders` - Create folder
- `GET /api/v1/materials/folders` - List folders
- `PUT /api/v1/materials/folders/{id}` - Update folder
- `DELETE /api/v1/materials/folders/{id}` - Delete folder
- `POST /api/v1/materials/folders/{id}/materials/{material_id}` - Add to folder
- `DELETE /api/v1/materials/folders/{id}/materials/{material_id}` - Remove from folder
- `GET /api/v1/materials/folders/{id}/materials` - Get folder contents

**Statistics:**
- `GET /api/v1/materials/stats/overview` - Get statistics
- `GET /api/v1/materials/stats/quota` - Get storage quota

#### Service Layer
`MaterialService` with 20+ methods for:
- File upload and validation
- Storage quota management
- CRUD operations
- Version control
- Sharing management
- Access tracking
- Statistics and analytics
- Folder management

### Frontend (React + TypeScript)

#### Components
- **MaterialList**: Grid/list view with sorting and filtering
- **MaterialUpload**: Drag-and-drop upload with progress tracking
- **MaterialsPage**: Main page with tabs (All Materials, Folders, Statistics)

#### Services
- **materialService**: Complete API client with helper methods

#### Types
Comprehensive TypeScript types for all data structures

## Configuration

### Environment Variables (.env)

```env
# Material Management Settings
MATERIAL_UPLOAD_DIR=uploads/materials/
MAX_MATERIAL_SIZE=52428800  # 50MB
ALLOWED_MATERIAL_TYPES=pdf,doc,docx,ppt,pptx,xls,xlsx,jpg,jpeg,png,gif,webp,mp4,mp3,wav,zip,txt,csv
MAX_MATERIALS_PER_TEACHER=1000
TEACHER_STORAGE_QUOTA_MB=5000  # 5GB per teacher
ENABLE_MATERIAL_PREVIEW=True
ENABLE_MATERIAL_VERSIONING=True
MATERIAL_RETENTION_DAYS=365  # Keep deleted materials for 1 year
```

## Supported File Types

- **Documents**: PDF, DOC, DOCX, TXT
- **Presentations**: PPT, PPTX
- **Spreadsheets**: XLS, XLSX, CSV
- **Images**: JPG, JPEG, PNG, GIF, WEBP
- **Videos**: MP4
- **Audio**: MP3, WAV
- **Archives**: ZIP

## Security Features

- **Role-Based Access Control**: Teachers only for uploads/management
- **School Isolation**: Multi-tenancy support
- **Ownership Verification**: Users can only modify their own materials
- **File Type Validation**: Whitelist of allowed file types
- **File Size Limits**: Configurable maximum file size
- **Storage Quota Enforcement**: Per-teacher storage limits

## Usage

### For Teachers

1. **Upload Materials**:
   - Click "Upload Material" button
   - Drag and drop files or click to browse
   - Fill in metadata (title, description, subject, grade, topic, tags)
   - Choose to publish immediately or save as draft
   - Optionally schedule for future publication

2. **Organize Materials**:
   - Create folders for better organization
   - Add materials to folders
   - Use tags for categorization
   - Mark favorites for quick access

3. **Share Materials**:
   - Select material(s) to share
   - Choose share type (class, student, teacher, public)
   - Set permissions (view, download)
   - Optionally set expiration date

4. **Track Usage**:
   - View statistics dashboard
   - See view and download counts
   - Monitor storage usage
   - Identify popular materials

### For Students

1. **Access Shared Materials**:
   - View materials shared by teachers
   - Filter by subject, grade, or topic
   - Preview supported file types
   - Download materials (if permitted)

## Database Migration

The database migration has been created and applied:

```bash
cd backend
alembic upgrade head
```

## API Documentation

Once the server is running, access the interactive API documentation at:
- Swagger UI: `http://localhost:8000/api/v1/docs`
- ReDoc: `http://localhost:8000/api/v1/redoc`

## Navigation

The Materials Management page is accessible from the sidebar for teachers:
- **Path**: `/{schoolCode}/teacher/materials`
- **Icon**: Folder icon
- **Label**: "Materials"

## Future Enhancements

The following features are planned for future releases:

1. **Advanced Features**:
   - [ ] Material templates
   - [ ] Collaborative editing
   - [ ] Comments and annotations
   - [ ] Material ratings and reviews
   - [ ] Advanced search with full-text indexing

2. **Integration**:
   - [ ] Integration with assignments
   - [ ] Integration with lesson plans
   - [ ] Calendar integration for scheduled materials
   - [ ] Email notifications for new materials

3. **Analytics**:
   - [ ] Detailed analytics dashboard
   - [ ] Student engagement metrics
   - [ ] Material effectiveness tracking
   - [ ] Export analytics reports

4. **UI Enhancements**:
   - [ ] List view for materials
   - [ ] Advanced folder tree view
   - [ ] Material preview modal
   - [ ] Batch operations UI
   - [ ] Material sharing modal

## Testing

### Backend Tests
```bash
cd backend
pytest tests/test_materials.py -v
```

### Frontend Tests
```bash
cd frontend
npm test -- MaterialList MaterialUpload MaterialsPage
```

## Performance Considerations

- **Lazy Loading**: Materials are loaded on demand
- **Pagination**: Default 100 items per page
- **Caching**: Consider implementing Redis caching for frequently accessed materials
- **CDN**: Consider using a CDN for serving static files
- **Async Operations**: All database operations are asynchronous

## Troubleshooting

### Common Issues

1. **Upload Fails**:
   - Check file size (max 50MB)
   - Verify file type is allowed
   - Check storage quota

2. **Preview Not Working**:
   - Only PDF, images, and some document types support preview
   - Check browser compatibility

3. **Sharing Not Working**:
   - Verify target (class/student) exists
   - Check permissions
   - Ensure material is published

## Support

For issues or questions, please contact the development team or create an issue in the repository.

## License

This feature is part of the School Management System and follows the same license.

