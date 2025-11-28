from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.models.notification import Notification, NotificationType
from app.schemas.notification import NotificationCreate, NotificationUpdate

class NotificationService:
    @staticmethod
    async def create_notification(
        db: AsyncSession,
        notification_data: NotificationCreate,
        school_id: str
    ) -> Notification:
        notification = Notification(
            **notification_data.dict(),
            school_id=school_id
        )
        db.add(notification)
        await db.commit()
        await db.refresh(notification)
        return notification

    @staticmethod
    async def get_notifications(
        db: AsyncSession,
        user_id: str,
        school_id: str,
        skip: int = 0,
        limit: int = 20,
        unread_only: bool = False
    ) -> Tuple[List[Notification], int]:
        query = select(Notification).where(
            Notification.user_id == user_id,
            Notification.school_id == school_id,
            Notification.is_deleted == False
        )

        if unread_only:
            query = query.where(Notification.is_read == False)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total = (await db.execute(count_query)).scalar()

        # Get paginated results
        query = query.order_by(desc(Notification.created_at)).offset(skip).limit(limit)
        result = await db.execute(query)
        notifications = result.scalars().all()

        return list(notifications), total

    @staticmethod
    async def mark_as_read(
        db: AsyncSession,
        notification_id: str,
        user_id: str,
        school_id: str
    ) -> Optional[Notification]:
        result = await db.execute(
            select(Notification).where(
                Notification.id == notification_id,
                Notification.user_id == user_id,
                Notification.school_id == school_id,
                Notification.is_deleted == False
            )
        )
        notification = result.scalar_one_or_none()
        if notification:
            notification.is_read = True
            await db.commit()
            await db.refresh(notification)
        return notification

    @staticmethod
    async def mark_all_as_read(
        db: AsyncSession,
        user_id: str,
        school_id: str
    ) -> int:
        # This is a bit more complex with SQLAlchemy async, but we can iterate or use update
        # Using update statement is more efficient
        from sqlalchemy import update
        
        stmt = update(Notification).where(
            Notification.user_id == user_id,
            Notification.school_id == school_id,
            Notification.is_read == False,
            Notification.is_deleted == False
        ).values(is_read=True)
        
        result = await db.execute(stmt)
        await db.commit()
        return result.rowcount
