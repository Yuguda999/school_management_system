from typing import List, Optional, Tuple, Any, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLogCreate

class AuditService:
    @staticmethod
    async def log_action(
        db: AsyncSession,
        audit_data: AuditLogCreate,
        school_id: str
    ) -> AuditLog:
        audit_log = AuditLog(
            **audit_data.dict(),
            school_id=school_id
        )
        db.add(audit_log)
        await db.commit()
        await db.refresh(audit_log)
        return audit_log

    @staticmethod
    async def get_audit_logs(
        db: AsyncSession,
        school_id: str,
        skip: int = 0,
        limit: int = 50,
        user_id: Optional[str] = None,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        action: Optional[str] = None
    ) -> Tuple[List[AuditLog], int]:
        query = select(AuditLog).where(
            AuditLog.school_id == school_id,
            AuditLog.is_deleted == False
        )

        if user_id:
            query = query.where(AuditLog.user_id == user_id)
        if entity_type:
            query = query.where(AuditLog.entity_type == entity_type)
        if entity_id:
            query = query.where(AuditLog.entity_id == entity_id)
        if action:
            query = query.where(AuditLog.action == action)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total = (await db.execute(count_query)).scalar()

        # Get paginated results
        query = query.order_by(desc(AuditLog.created_at)).offset(skip).limit(limit)
        result = await db.execute(query)
        logs = result.scalars().all()

        return list(logs), total
