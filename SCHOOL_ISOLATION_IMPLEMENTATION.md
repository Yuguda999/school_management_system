# School Isolation Implementation Guide

## Overview

This document describes the comprehensive school isolation implementation in the school management system. The system ensures complete data isolation between different schools, preventing any cross-tenant data access.

## Architecture

### 1. Database Level Isolation

#### TenantBaseModel
All school-specific entities inherit from `TenantBaseModel` which includes:
- `school_id`: Foreign key to the schools table
- `is_deleted`: Soft delete flag
- Standard audit fields (created_at, updated_at)

```python
class TenantBaseModel(BaseModel, TenantMixin):
    """Base model class for tenant-specific entities"""
    __abstract__ = True
```

#### Models with School Isolation
- **Students**: All student records are isolated by school
- **Teachers/Users**: All staff members belong to specific schools
- **Classes**: Class definitions are school-specific
- **Subjects**: Subject catalogs are isolated per school
- **Terms**: Academic terms are school-specific
- **Grades**: All grade records include school_id
- **Fees**: Fee structures and payments are school-isolated
- **Messages**: Communication is isolated per school
- **Documents**: Student documents are school-specific
- **Enrollments**: Student enrollments include school_id

### 2. Association Tables

All many-to-many association tables include `school_id` for proper isolation:

```python
teacher_subject_association = Table(
    'teacher_subjects',
    TenantBaseModel.metadata,
    Column('id', String(36), primary_key=True, default=lambda: str(__import__('uuid').uuid4())),
    Column('teacher_id', String(36), ForeignKey('users.id'), nullable=False),
    Column('subject_id', String(36), ForeignKey('subjects.id'), nullable=False),
    Column('school_id', String(36), ForeignKey('schools.id'), nullable=False),  # School isolation
    # ... other fields
)
```

### 3. Service Layer Isolation

#### School Context Management
All service methods require `school_id` parameter and filter queries accordingly:

```python
@staticmethod
async def get_students(
    db: AsyncSession,
    school_id: str,  # Required for isolation
    class_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> List[Student]:
    query = select(Student).where(
        Student.school_id == school_id,  # Always filter by school
        Student.is_deleted == False
    )
    # ... rest of implementation
```

#### Validation Functions
Comprehensive validation ensures entities belong to the correct school:

```python
async def validate_entity_belongs_to_school(
    db: AsyncSession,
    entity_id: str,
    entity_model,
    school_id: str,
    error_message: str = "Entity not found or does not belong to your school"
) -> bool:
    # Validation logic with proper error handling
```

### 4. API Layer Isolation

#### School Context Dependencies
All API endpoints use school context dependencies:

```python
@router.get("/students")
async def get_students(
    current_school: School = Depends(get_current_school),  # School context
    db: AsyncSession = Depends(get_db)
) -> Any:
    # Implementation with school isolation
```

#### Role-Based Access Control
Combined with school isolation for comprehensive security:

```python
@router.post("/students")
async def create_student(
    student_data: StudentCreate,
    current_user: User = Depends(require_school_admin()),  # Role check
    current_school: School = Depends(get_current_school),  # School context
    db: AsyncSession = Depends(get_db)
) -> Any:
    # Implementation with both role and school validation
```

## Implementation Details

### 1. School Context Management

#### JWT Token Structure
JWT tokens include school context:
```json
{
    "sub": "user_id",
    "email": "user@example.com",
    "role": "teacher",
    "school_id": "school_uuid"  // School context
}
```

#### School Selection Flow
1. User logs in
2. For school owners: Select school from owned schools
3. New JWT token issued with selected school_id
4. All subsequent requests use school context

### 2. Database Query Filtering

#### Automatic School Filtering
All queries automatically include school filtering:

```python
# Service method example
async def get_entity_by_id(db: AsyncSession, entity_id: str, school_id: str):
    result = await db.execute(
        select(EntityModel).where(
            and_(
                EntityModel.id == entity_id,
                EntityModel.school_id == school_id,  # Always filter by school
                EntityModel.is_deleted == False
            )
        )
    )
    return result.scalar_one_or_none()
```

#### Raw Query Safety
Raw SQL queries must manually include school filtering:

```python
query = text("""
    SELECT * FROM students s
    JOIN classes c ON s.current_class_id = c.id
    WHERE s.school_id = :school_id  -- Manual school filter
    AND s.is_deleted = false
    AND c.school_id = :school_id    -- Manual school filter for join
""")
```

### 3. Validation and Error Handling

#### Entity Validation
Before any operation, validate entity belongs to school:

```python
# Validate before update
await validate_entity_belongs_to_school(
    db, entity_id, EntityModel, school_id,
    error_message="Entity not found in your school"
)
```

#### Bulk Operations
Validate multiple entities belong to school:

```python
# Validate bulk operations
await validate_multiple_entities_belong_to_school(
    db, entity_ids, EntityModel, school_id,
    error_message="One or more entities do not belong to your school"
)
```

### 4. Security Measures

#### Access Control Matrix
| Role | School Access | Cross-School Access |
|------|---------------|-------------------|
| Platform Admin | All Schools | ✅ Yes |
| School Owner | Owned Schools | ✅ Yes (with ownership verification) |
| School Admin | Current School | ❌ No |
| Teacher | Current School | ❌ No |
| Parent | Current School | ❌ No |
| Student | Current School | ❌ No |

#### Teacher Access Restrictions
Teachers can only access:
1. Students in their assigned classes
2. Subjects they teach
3. Grades for students they have access to

```python
async def check_teacher_can_access_student(
    db: AsyncSession,
    teacher_id: str,
    student_id: str,
    school_id: str
) -> bool:
    # Complex query checking class assignments and subject teaching
```

## Utility Classes and Functions

### 1. SchoolIsolationValidator
Comprehensive validation for school isolation:
- `validate_single_entity_access()`
- `validate_multiple_entities_access()`
- `validate_related_entities_access()`

### 2. SchoolIsolationService
Service operations with built-in isolation:
- `create_entity_with_validation()`
- `update_entity_with_validation()`
- `delete_entity_with_validation()`

### 3. SchoolIsolationQueryBuilder
Query builder with automatic school filtering:
- `create_base_query()`
- `add_pagination()`
- `add_ordering()`
- `add_search_filter()`

### 4. Convenience Functions
Simple functions for common operations:
- `validate_and_get_entity()`
- `validate_and_get_entities()`
- `create_school_filtered_query()`

## Testing

### 1. Unit Tests
Comprehensive test suite covering:
- Entity validation
- Cross-school access prevention
- Service layer isolation
- API endpoint isolation

### 2. Integration Tests
End-to-end tests verifying:
- Complete data isolation
- Role-based access control
- School switching functionality

### 3. Security Tests
Penetration testing scenarios:
- Attempting cross-school data access
- JWT token manipulation
- Direct database queries

## Best Practices

### 1. Development Guidelines
- Always include `school_id` in service method signatures
- Use school context dependencies in API endpoints
- Validate entity ownership before operations
- Test cross-school isolation scenarios

### 2. Code Review Checklist
- [ ] All entities inherit from TenantBaseModel
- [ ] All service methods filter by school_id
- [ ] All API endpoints use school context
- [ ] All database queries include school filtering
- [ ] Cross-school access is properly prevented

### 3. Deployment Considerations
- Database indexes on school_id columns
- Monitoring for isolation violations
- Regular security audits
- Backup and recovery procedures

## Monitoring and Alerting

### 1. Isolation Violations
Monitor for:
- Cross-school data access attempts
- Missing school_id filters in queries
- JWT token manipulation

### 2. Performance Metrics
Track:
- Query performance with school filtering
- School switching frequency
- Data isolation effectiveness

### 3. Security Alerts
Alert on:
- Unauthorized cross-school access
- Suspicious query patterns
- JWT token anomalies

## Conclusion

The school isolation implementation provides comprehensive data separation between schools while maintaining system performance and usability. The multi-layered approach ensures security at the database, service, and API levels, with extensive validation and monitoring to prevent any cross-tenant data access.

Key benefits:
- ✅ Complete data isolation
- ✅ Role-based access control
- ✅ Comprehensive validation
- ✅ Performance optimization
- ✅ Security monitoring
- ✅ Easy maintenance

This implementation ensures that each school operates in complete isolation while sharing the same infrastructure, providing a secure and scalable multi-tenant solution.
