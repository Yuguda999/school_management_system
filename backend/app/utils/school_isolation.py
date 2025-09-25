"""
School Isolation Utilities

This module provides comprehensive utilities for ensuring complete school isolation
in the multi-tenant school management system.
"""

from typing import List, Optional, Any, Type, Union
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, text
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
import logging

logger = logging.getLogger(__name__)


class SchoolIsolationError(Exception):
    """Custom exception for school isolation violations"""
    pass


class SchoolIsolationValidator:
    """Comprehensive school isolation validator"""
    
    @staticmethod
    async def validate_single_entity_access(
        db: AsyncSession,
        entity_id: str,
        entity_model: Type,
        school_id: str,
        user_id: Optional[str] = None,
        user_role: Optional[str] = None,
        error_message: Optional[str] = None
    ) -> Any:
        """
        Validate that a single entity belongs to the school and user has access
        
        Args:
            db: Database session
            entity_id: ID of the entity to validate
            entity_model: SQLAlchemy model class
            school_id: School ID from context
            user_id: User ID for additional access checks
            user_role: User role for role-based access
            error_message: Custom error message
            
        Returns:
            The entity if validation passes
            
        Raises:
            HTTPException: If validation fails
        """
        if not error_message:
            error_message = f"{entity_model.__name__} not found or access denied"
        
        # Base query with school isolation
        query = select(entity_model).where(
            and_(
                entity_model.id == entity_id,
                entity_model.school_id == school_id,
                entity_model.is_deleted == False
            )
        )
        
        result = await db.execute(query)
        entity = result.scalar_one_or_none()
        
        if entity is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_message
            )
        
        # Additional role-based access checks can be added here
        if user_id and hasattr(entity, 'created_by'):
            if entity.created_by != user_id and user_role not in ['school_admin', 'school_owner']:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: You can only access entities you created"
                )
        
        return entity
    
    @staticmethod
    async def validate_multiple_entities_access(
        db: AsyncSession,
        entity_ids: List[str],
        entity_model: Type,
        school_id: str,
        error_message: Optional[str] = None
    ) -> List[Any]:
        """
        Validate that multiple entities belong to the school
        
        Args:
            db: Database session
            entity_ids: List of entity IDs to validate
            entity_model: SQLAlchemy model class
            school_id: School ID from context
            error_message: Custom error message
            
        Returns:
            List of valid entities
            
        Raises:
            HTTPException: If any entity validation fails
        """
        if not entity_ids:
            return []
        
        if not error_message:
            error_message = f"One or more {entity_model.__name__} entities do not belong to your school"
        
        query = select(entity_model).where(
            and_(
                entity_model.id.in_(entity_ids),
                entity_model.school_id == school_id,
                entity_model.is_deleted == False
            )
        )
        
        result = await db.execute(query)
        entities = list(result.scalars().all())
        
        if len(entities) != len(entity_ids):
            missing_ids = set(entity_ids) - {entity.id for entity in entities}
            logger.warning(f"School isolation violation: Missing entities {missing_ids} for school {school_id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message
            )
        
        return entities
    
    @staticmethod
    async def validate_related_entities_access(
        db: AsyncSession,
        entity_data: dict,
        school_id: str,
        related_models: dict
    ) -> dict:
        """
        Validate that all related entities in the data belong to the school
        
        Args:
            db: Database session
            entity_data: Dictionary containing entity data with foreign key IDs
            school_id: School ID from context
            related_models: Dictionary mapping field names to model classes
            
        Returns:
            Dictionary of validated entities
            
        Raises:
            HTTPException: If any related entity validation fails
        """
        validated_entities = {}
        
        for field_name, model_class in related_models.items():
            if field_name in entity_data and entity_data[field_name]:
                entity_id = entity_data[field_name]
                entity = await SchoolIsolationValidator.validate_single_entity_access(
                    db, entity_id, model_class, school_id,
                    error_message=f"Related {model_class.__name__} does not belong to your school"
                )
                validated_entities[field_name] = entity
        
        return validated_entities


class SchoolIsolationQueryBuilder:
    """Builder for school-isolated queries"""
    
    def __init__(self, school_id: str):
        self.school_id = school_id
    
    def create_base_query(self, model_class: Type, include_deleted: bool = False):
        """Create a base query with school isolation"""
        query = select(model_class)
        
        conditions = [model_class.school_id == self.school_id]
        
        if not include_deleted:
            conditions.append(model_class.is_deleted == False)
        
        return query.where(and_(*conditions))
    
    def add_pagination(self, query, skip: int = 0, limit: int = 100):
        """Add pagination to query"""
        return query.offset(skip).limit(limit)
    
    def add_ordering(self, query, order_by: Union[str, list], desc: bool = False):
        """Add ordering to query"""
        if isinstance(order_by, str):
            order_by = [order_by]
        
        for field in order_by:
            if desc:
                query = query.order_by(getattr(query.column_descriptions[0]['type'], field).desc())
            else:
                query = query.order_by(getattr(query.column_descriptions[0]['type'], field))
        
        return query
    
    def add_search_filter(self, query, search_term: str, search_fields: List[str]):
        """Add search filter to query"""
        if not search_term:
            return query
        
        search_conditions = []
        for field in search_fields:
            field_attr = getattr(query.column_descriptions[0]['type'], field)
            search_conditions.append(field_attr.ilike(f"%{search_term}%"))
        
        return query.where(or_(*search_conditions))


class SchoolIsolationService:
    """Service class for school isolation operations"""
    
    @staticmethod
    async def create_entity_with_validation(
        db: AsyncSession,
        entity_data: dict,
        entity_model: Type,
        school_id: str,
        related_models: Optional[dict] = None
    ) -> Any:
        """
        Create an entity with comprehensive school isolation validation
        
        Args:
            db: Database session
            entity_data: Data for creating the entity
            entity_model: SQLAlchemy model class
            school_id: School ID from context
            related_models: Dictionary of related models to validate
            
        Returns:
            Created entity
        """
        # Validate related entities if provided
        if related_models:
            await SchoolIsolationValidator.validate_related_entities_access(
                db, entity_data, school_id, related_models
            )
        
        # Ensure school_id is set
        entity_data['school_id'] = school_id
        
        # Create entity
        entity = entity_model(**entity_data)
        db.add(entity)
        await db.commit()
        await db.refresh(entity)
        
        return entity
    
    @staticmethod
    async def update_entity_with_validation(
        db: AsyncSession,
        entity_id: str,
        entity_data: dict,
        entity_model: Type,
        school_id: str,
        user_id: Optional[str] = None,
        user_role: Optional[str] = None,
        related_models: Optional[dict] = None
    ) -> Any:
        """
        Update an entity with comprehensive school isolation validation
        
        Args:
            db: Database session
            entity_id: ID of entity to update
            entity_data: Updated data
            entity_model: SQLAlchemy model class
            school_id: School ID from context
            user_id: User ID for access validation
            user_role: User role for access validation
            related_models: Dictionary of related models to validate
            
        Returns:
            Updated entity
        """
        # Validate entity access
        entity = await SchoolIsolationValidator.validate_single_entity_access(
            db, entity_id, entity_model, school_id, user_id, user_role
        )
        
        # Validate related entities if provided
        if related_models:
            await SchoolIsolationValidator.validate_related_entities_access(
                db, entity_data, school_id, related_models
            )
        
        # Update entity
        for key, value in entity_data.items():
            if hasattr(entity, key):
                setattr(entity, key, value)
        
        await db.commit()
        await db.refresh(entity)
        
        return entity
    
    @staticmethod
    async def delete_entity_with_validation(
        db: AsyncSession,
        entity_id: str,
        entity_model: Type,
        school_id: str,
        user_id: Optional[str] = None,
        user_role: Optional[str] = None,
        hard_delete: bool = False
    ) -> bool:
        """
        Delete an entity with comprehensive school isolation validation
        
        Args:
            db: Database session
            entity_id: ID of entity to delete
            entity_model: SQLAlchemy model class
            school_id: School ID from context
            user_id: User ID for access validation
            user_role: User role for access validation
            hard_delete: Whether to perform hard delete or soft delete
            
        Returns:
            True if deletion successful
        """
        # Validate entity access
        entity = await SchoolIsolationValidator.validate_single_entity_access(
            db, entity_id, entity_model, school_id, user_id, user_role
        )
        
        if hard_delete:
            await db.delete(entity)
        else:
            entity.is_deleted = True
        
        await db.commit()
        
        return True


class SchoolIsolationMiddleware:
    """Middleware for automatic school isolation"""
    
    @staticmethod
    def validate_request_context(school_id: str, user_id: str, user_role: str):
        """Validate request context for school isolation"""
        if not school_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="School context required for this operation"
            )
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User authentication required"
            )
    
    @staticmethod
    def log_isolation_violation(
        user_id: str,
        school_id: str,
        operation: str,
        entity_type: str,
        entity_id: str,
        details: Optional[str] = None
    ):
        """Log school isolation violations for monitoring"""
        logger.warning(
            f"School isolation violation: User {user_id} from school {school_id} "
            f"attempted {operation} on {entity_type} {entity_id}. {details or ''}"
        )


# Convenience functions for common operations
async def validate_and_get_entity(
    db: AsyncSession,
    entity_id: str,
    entity_model: Type,
    school_id: str,
    error_message: Optional[str] = None
) -> Any:
    """Convenience function for validating and getting a single entity"""
    return await SchoolIsolationValidator.validate_single_entity_access(
        db, entity_id, entity_model, school_id, error_message=error_message
    )


async def validate_and_get_entities(
    db: AsyncSession,
    entity_ids: List[str],
    entity_model: Type,
    school_id: str,
    error_message: Optional[str] = None
) -> List[Any]:
    """Convenience function for validating and getting multiple entities"""
    return await SchoolIsolationValidator.validate_multiple_entities_access(
        db, entity_ids, entity_model, school_id, error_message=error_message
    )


def create_school_filtered_query(model_class: Type, school_id: str):
    """Convenience function for creating school-filtered queries"""
    builder = SchoolIsolationQueryBuilder(school_id)
    return builder.create_base_query(model_class)
