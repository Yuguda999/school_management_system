"""
Promotion Service - Handles end-of-session student promotions

This service handles:
- Identifying students eligible for promotion
- Calculating session averages
- Executing bulk promotions
- Auto-promotion based on school rules
- Class progression mapping
"""

from typing import Optional, List, Dict, Tuple
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from datetime import date
import uuid

from app.models.academic_session import AcademicSession, SessionStatus
from app.models.academic import Term, Class, ClassLevel
from app.models.student import Student, StudentClassHistory, ClassHistoryStatus
from app.models.grade import Grade
from app.models.school import School
from app.schemas.academic_session import (
    PromotionCandidate,
    PromotionDecision,
    PromotionResult,
    BulkPromotionResult,
    PromotionPreviewResponse,
)
from app.services.notification_service import NotificationService
from app.schemas.notification import NotificationCreate
from app.models.notification import NotificationType


# Class level progression order
CLASS_LEVEL_ORDER = [
    ClassLevel.NURSERY_1,
    ClassLevel.NURSERY_2,
    ClassLevel.PRIMARY_1,
    ClassLevel.PRIMARY_2,
    ClassLevel.PRIMARY_3,
    ClassLevel.PRIMARY_4,
    ClassLevel.PRIMARY_5,
    ClassLevel.PRIMARY_6,
    ClassLevel.JSS_1,
    ClassLevel.JSS_2,
    ClassLevel.JSS_3,
    ClassLevel.SS_1,
    ClassLevel.SS_2,
    ClassLevel.SS_3,
]


class PromotionService:
    """Service for handling end-of-session student promotions"""
    
    @staticmethod
    def get_next_class_level(current_level: ClassLevel) -> Optional[ClassLevel]:
        """
        Get the next class level in the progression.
        Returns None if student is at the highest level (graduating).
        """
        try:
            current_index = CLASS_LEVEL_ORDER.index(current_level)
            if current_index >= len(CLASS_LEVEL_ORDER) - 1:
                return None  # Graduating
            return CLASS_LEVEL_ORDER[current_index + 1]
        except ValueError:
            return None
    
    @staticmethod
    async def get_class_progression_map(
        db: AsyncSession,
        school_id: str
    ) -> Dict[str, Tuple[str, str]]:
        """
        Get mapping of class_id -> (next_class_id, next_class_name)
        based on ClassLevel progression.
        
        Returns a dict where:
        - Key: current class ID
        - Value: tuple of (next class ID, next class name), or (None, "Graduated") if no next class
        """
        # Get all active classes for the school
        result = await db.execute(
            select(Class).where(
                Class.school_id == school_id,
                Class.is_active == True,
                Class.is_deleted == False
            ).order_by(Class.level, Class.name)
        )
        classes = result.scalars().all()
        
        # Group classes by level
        classes_by_level: Dict[ClassLevel, List[Class]] = {}
        for cls in classes:
            if cls.level not in classes_by_level:
                classes_by_level[cls.level] = []
            classes_by_level[cls.level].append(cls)
        
        progression_map = {}
        
        for cls in classes:
            next_level = PromotionService.get_next_class_level(cls.level)
            
            if next_level is None:
                # Graduating - no next class
                progression_map[cls.id] = (None, "Graduated")
            elif next_level in classes_by_level:
                # Find a suitable next class at the next level
                next_classes = classes_by_level[next_level]
                if next_classes:
                    # For now, just use the first class at the next level
                    # In a more sophisticated system, we could match by section
                    next_class = next_classes[0]
                    progression_map[cls.id] = (next_class.id, next_class.name)
                else:
                    progression_map[cls.id] = (None, f"No {next_level.value} class found")
            else:
                progression_map[cls.id] = (None, f"No {next_level.value} class found")
        
        return progression_map
    
    @staticmethod
    async def calculate_student_session_average(
        db: AsyncSession,
        student_id: str,
        session_id: str,
        school_id: str
    ) -> Optional[Decimal]:
        """
        Calculate a student's average score across all terms in a session.
        
        This calculates the overall average of all grades in all terms of the session.
        """
        # Get all terms for this session
        terms_result = await db.execute(
            select(Term.id).where(
                Term.academic_session_id == session_id,
                Term.school_id == school_id,
                Term.is_deleted == False
            )
        )
        term_ids = [row[0] for row in terms_result.fetchall()]
        
        if not term_ids:
            return None
        
        # Calculate average of all grades for this student in these terms
        result = await db.execute(
            select(func.avg(Grade.score)).where(
                Grade.student_id == student_id,
                Grade.term_id.in_(term_ids),
                Grade.school_id == school_id,
                Grade.is_deleted == False
            )
        )
        avg = result.scalar()
        
        return Decimal(str(avg)).quantize(Decimal('0.01')) if avg else None
    
    @staticmethod
    async def get_promotion_candidates(
        db: AsyncSession,
        school_id: str,
        session_id: str,
        class_id: Optional[str] = None
    ) -> List[PromotionCandidate]:
        """
        Get all students eligible for promotion review in a session.
        
        This returns students who:
        1. Have active class history in the given session, OR
        2. Are currently assigned to a class (fallback for students without history)
        """
        from sqlalchemy import or_
        from app.models.student import StudentStatus
        
        # Get the session
        session_result = await db.execute(
            select(AcademicSession).where(
                AcademicSession.id == session_id,
                AcademicSession.school_id == school_id,
                AcademicSession.is_deleted == False
            )
        )
        session = session_result.scalar_one_or_none()
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Academic session not found"
            )
        
        # Get class progression map
        progression_map = await PromotionService.get_class_progression_map(db, school_id)
        
        candidates = []
        processed_student_ids = set()
        
        # First, try to get students from StudentClassHistory
        query = select(StudentClassHistory).options(
            selectinload(StudentClassHistory.student),
            selectinload(StudentClassHistory.class_)
        ).where(
            StudentClassHistory.school_id == school_id,
            or_(
                StudentClassHistory.academic_session_id == session_id,
                StudentClassHistory.academic_session == session.name
            ),
            StudentClassHistory.is_deleted == False,
            StudentClassHistory.status.in_([
                ClassHistoryStatus.ACTIVE,
                ClassHistoryStatus.COMPLETED
            ])
        )
        
        if class_id:
            query = query.where(StudentClassHistory.class_id == class_id)
        
        result = await db.execute(query)
        histories = result.scalars().all()
        
        # Group by student (take the most recent history per student)
        student_histories: Dict[str, StudentClassHistory] = {}
        for history in histories:
            if history.student_id not in student_histories:
                student_histories[history.student_id] = history
        
        # Process students with class history
        for student_id, history in student_histories.items():
            student = history.student
            current_class = history.class_
            
            if not student or not current_class:
                continue
            
            processed_student_ids.add(student_id)
            
            # Calculate session average
            session_avg = await PromotionService.calculate_student_session_average(
                db, student_id, session_id, school_id
            )
            
            # Determine next class
            next_class_id, next_class_name = progression_map.get(
                current_class.id, (None, "Unknown")
            )
            
            # Determine suggested action
            if next_class_id is None and next_class_name == "Graduated":
                suggested_action = "graduate"
            elif session_avg and session_avg < 40:
                suggested_action = "repeat"
            else:
                suggested_action = "promote"
            
            candidates.append(PromotionCandidate(
                student_id=student.id,
                student_name=student.full_name,
                admission_number=student.admission_number,
                current_class_id=current_class.id,
                current_class_name=current_class.name,
                session_average=float(session_avg) if session_avg else None,
                promotion_eligible=history.promotion_eligible,
                suggested_action=suggested_action,
                next_class_id=next_class_id,
                next_class_name=next_class_name
            ))
        
        # FALLBACK: If no students found from class history, get from Student.current_class_id
        # This handles students who were created before the session system was set up
        if not candidates:
            student_query = select(Student).options(
                selectinload(Student.current_class)
            ).where(
                Student.school_id == school_id,
                Student.is_deleted == False,
                Student.status == StudentStatus.ACTIVE,
                Student.current_class_id.isnot(None)
            )
            
            if class_id:
                student_query = student_query.where(Student.current_class_id == class_id)
            
            student_result = await db.execute(student_query)
            students = student_result.scalars().all()
            
            for student in students:
                if student.id in processed_student_ids:
                    continue
                
                current_class = student.current_class
                if not current_class:
                    continue
                
                # Calculate session average (may be None if no grades exist)
                session_avg = await PromotionService.calculate_student_session_average(
                    db, student.id, session_id, school_id
                )
                
                # Determine next class
                next_class_id, next_class_name = progression_map.get(
                    current_class.id, (None, "Unknown")
                )
                
                # Determine suggested action
                if next_class_id is None and next_class_name == "Graduated":
                    suggested_action = "graduate"
                elif session_avg and session_avg < 40:
                    suggested_action = "repeat"
                else:
                    suggested_action = "promote"
                
                candidates.append(PromotionCandidate(
                    student_id=student.id,
                    student_name=student.full_name,
                    admission_number=student.admission_number,
                    current_class_id=current_class.id,
                    current_class_name=current_class.name,
                    session_average=float(session_avg) if session_avg else None,
                    promotion_eligible=True,  # Default to eligible for fallback students
                    suggested_action=suggested_action,
                    next_class_id=next_class_id,
                    next_class_name=next_class_name
                ))
        
        return candidates
    
    @staticmethod
    async def promote_students(
        db: AsyncSession,
        school_id: str,
        session_id: str,
        decisions: List[PromotionDecision],
        decided_by: str
    ) -> BulkPromotionResult:
        """
        Execute bulk promotion decisions.
        
        For each decision:
        1. Update the class history record with the decision
        2. If promoting/transferring: create new class history for new session
        3. Update student's current_class_id
        4. Send notifications
        """
        # Get the session
        session_result = await db.execute(
            select(AcademicSession).where(
                AcademicSession.id == session_id,
                AcademicSession.school_id == school_id,
                AcademicSession.is_deleted == False
            )
        )
        session = session_result.scalar_one_or_none()
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Academic session not found"
            )
        
        results = []
        stats = {
            'promoted': 0,
            'repeated': 0,
            'graduated': 0,
            'transferred': 0,
            'successful': 0,
            'failed': 0
        }
        
        for decision in decisions:
            try:
                # Get the class history record
                history_result = await db.execute(
                    select(StudentClassHistory).options(
                        selectinload(StudentClassHistory.student),
                        selectinload(StudentClassHistory.class_)
                    ).where(
                        StudentClassHistory.id == decision.class_history_id,
                        StudentClassHistory.school_id == school_id,
                        StudentClassHistory.is_deleted == False
                    )
                )
                history = history_result.scalar_one_or_none()
                
                if not history:
                    results.append(PromotionResult(
                        student_id=decision.student_id,
                        student_name="Unknown",
                        success=False,
                        action=decision.action,
                        from_class="Unknown",
                        error="Class history record not found"
                    ))
                    stats['failed'] += 1
                    continue
                
                student = history.student
                from_class = history.class_
                
                # Update the history record
                history.status = ClassHistoryStatus.COMPLETED
                history.completion_date = date.today()
                history.promotion_decision = decision.action
                history.decided_by = decided_by
                history.decision_date = date.today()
                history.remarks = decision.remarks
                history.is_current = False
                
                to_class_name = None
                
                if decision.action == 'promote' or decision.action == 'transfer':
                    # Get the target class
                    target_class_result = await db.execute(
                        select(Class).where(
                            Class.id == decision.next_class_id,
                            Class.school_id == school_id,
                            Class.is_deleted == False
                        )
                    )
                    target_class = target_class_result.scalar_one_or_none()
                    
                    if not target_class:
                        results.append(PromotionResult(
                            student_id=student.id,
                            student_name=student.full_name,
                            success=False,
                            action=decision.action,
                            from_class=from_class.name,
                            error="Target class not found"
                        ))
                        stats['failed'] += 1
                        continue
                    
                    to_class_name = target_class.name
                    
                    # Update history with promotion info
                    history.status = ClassHistoryStatus.PROMOTED
                    history.promoted_to_class_id = target_class.id
                    history.promotion_date = date.today()
                    
                    # Update student's current class
                    student.current_class_id = target_class.id
                    
                    stats['promoted' if decision.action == 'promote' else 'transferred'] += 1
                
                elif decision.action == 'repeat':
                    history.status = ClassHistoryStatus.REPEATED
                    stats['repeated'] += 1
                
                elif decision.action == 'graduate':
                    history.status = ClassHistoryStatus.COMPLETED
                    history.promotion_decision = 'graduated'
                    # Optionally mark student as inactive or graduated
                    stats['graduated'] += 1
                
                # Send notification to student
                if student.user_id:
                    action_text = {
                        'promote': f'promoted to {to_class_name}',
                        'transfer': f'transferred to {to_class_name}',
                        'repeat': f'to repeat {from_class.name}',
                        'graduate': 'graduated!'
                    }
                    await NotificationService.create_notification(
                        db=db,
                        school_id=school_id,
                        notification_data=NotificationCreate(
                            user_id=student.user_id,
                            title="Promotion Update",
                            message=f"You have been {action_text.get(decision.action, decision.action)}. Congratulations!" if decision.action in ['promote', 'graduate'] else f"You have been assigned {action_text.get(decision.action, decision.action)}.",
                            type=NotificationType.SUCCESS if decision.action in ['promote', 'graduate'] else NotificationType.INFO,
                            link="/academics/classes"
                        )
                    )
                
                results.append(PromotionResult(
                    student_id=student.id,
                    student_name=student.full_name,
                    success=True,
                    action=decision.action,
                    from_class=from_class.name,
                    to_class=to_class_name
                ))
                stats['successful'] += 1
                
            except Exception as e:
                results.append(PromotionResult(
                    student_id=decision.student_id,
                    student_name="Unknown",
                    success=False,
                    action=decision.action,
                    from_class="Unknown",
                    error=str(e)
                ))
                stats['failed'] += 1
        
        # Mark session as promotion completed
        session.promotion_completed = True
        
        await db.commit()
        
        return BulkPromotionResult(
            total_processed=len(decisions),
            successful=stats['successful'],
            failed=stats['failed'],
            promoted=stats['promoted'],
            repeated=stats['repeated'],
            graduated=stats['graduated'],
            transferred=stats['transferred'],
            results=results
        )
    
    @staticmethod
    async def preview_promotions(
        db: AsyncSession,
        school_id: str,
        session_id: str,
        class_id: Optional[str] = None
    ) -> PromotionPreviewResponse:
        """
        Preview what promotions would look like before executing.
        """
        # Get the session
        session_result = await db.execute(
            select(AcademicSession).where(
                AcademicSession.id == session_id,
                AcademicSession.school_id == school_id,
                AcademicSession.is_deleted == False
            )
        )
        session = session_result.scalar_one_or_none()
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Academic session not found"
            )
        
        candidates = await PromotionService.get_promotion_candidates(
            db, school_id, session_id, class_id
        )
        
        promotable = sum(1 for c in candidates if c.suggested_action == 'promote')
        repeating = sum(1 for c in candidates if c.suggested_action == 'repeat')
        graduating = sum(1 for c in candidates if c.suggested_action == 'graduate')
        
        return PromotionPreviewResponse(
            session_id=session_id,
            session_name=session.name,
            total_students=len(candidates),
            promotable=promotable,
            repeating=repeating,
            graduating=graduating,
            candidates=candidates
        )
    
    @staticmethod
    async def auto_promote_by_rules(
        db: AsyncSession,
        school_id: str,
        session_id: str,
        decided_by: str
    ) -> BulkPromotionResult:
        """
        Automatically promote students based on school's configured rules.
        
        This uses the promotion_mode and min_promotion_score from school settings.
        """
        # Get school settings
        school_result = await db.execute(
            select(School).where(
                School.id == school_id,
                School.is_deleted == False
            )
        )
        school = school_result.scalar_one_or_none()
        
        if not school:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="School not found"
            )
        
        # Get academic settings from school.settings
        settings = school.settings or {}
        academic_settings = settings.get('academic', {})
        promotion_mode = academic_settings.get('promotion_mode', 'automatic')
        min_score = academic_settings.get('min_promotion_score', 40.0)
        
        # Get candidates
        candidates = await PromotionService.get_promotion_candidates(
            db, school_id, session_id
        )
        
        # Build decisions based on promotion mode
        decisions = []
        
        for candidate in candidates:
            # Get the class history ID for this student
            history_result = await db.execute(
                select(StudentClassHistory.id).where(
                    StudentClassHistory.student_id == candidate.student_id,
                    StudentClassHistory.class_id == candidate.current_class_id,
                    StudentClassHistory.school_id == school_id,
                    StudentClassHistory.is_deleted == False,
                    StudentClassHistory.status.in_([
                        ClassHistoryStatus.ACTIVE,
                        ClassHistoryStatus.COMPLETED
                    ])
                ).order_by(StudentClassHistory.created_at.desc())
            )
            history_id_row = history_result.first()
            
            if not history_id_row:
                continue
            
            history_id = history_id_row[0]
            
            if promotion_mode == 'automatic':
                # Promote everyone except graduating students
                if candidate.next_class_id is None:
                    action = 'graduate'
                else:
                    action = 'promote'
            
            elif promotion_mode == 'performance_based':
                # Promote based on minimum score
                if candidate.next_class_id is None:
                    action = 'graduate'
                elif candidate.session_average is None:
                    action = 'promote'  # No grades, promote by default
                elif candidate.session_average >= min_score:
                    action = 'promote'
                else:
                    action = 'repeat'
            
            else:  # manual
                # Skip - manual mode requires explicit decisions
                continue
            
            decisions.append(PromotionDecision(
                student_id=candidate.student_id,
                class_history_id=history_id,
                action=action,
                next_class_id=candidate.next_class_id,
                remarks=f"Auto-promoted ({promotion_mode} mode)"
            ))
        
        if not decisions:
            return BulkPromotionResult(
                total_processed=0,
                successful=0,
                failed=0,
                promoted=0,
                repeated=0,
                graduated=0,
                transferred=0,
                results=[]
            )
        
        return await PromotionService.promote_students(
            db, school_id, session_id, decisions, decided_by
        )

    # =========================================================================
    # APPROVAL WORKFLOW METHODS
    # =========================================================================
    
    @staticmethod
    async def submit_for_approval(
        db: AsyncSession,
        school_id: str,
        session_id: str,
        decisions: List[dict],
        submitted_by: str,
        class_id: Optional[str] = None
    ) -> dict:
        """
        Submit promotion decisions for approval by school owner.
        Creates a PromotionRequest with pending status.
        """
        from app.models.promotion_request import PromotionRequest, PromotionRequestStatus
        
        # Create the promotion request
        promotion_request = PromotionRequest(
            id=str(uuid.uuid4()),
            school_id=school_id,
            session_id=session_id,
            class_id=class_id,
            submitted_by=submitted_by,
            decisions=decisions,
            status=PromotionRequestStatus.PENDING
        )
        
        db.add(promotion_request)
        await db.commit()
        await db.refresh(promotion_request)
        
        return {
            "id": promotion_request.id,
            "status": "pending",
            "message": "Promotion decisions submitted for approval",
            "total_decisions": len(decisions)
        }
    
    @staticmethod
    async def get_pending_approvals(
        db: AsyncSession,
        school_id: str,
        session_id: Optional[str] = None
    ) -> List[dict]:
        """
        Get all pending promotion requests for a school.
        """
        from app.models.promotion_request import PromotionRequest, PromotionRequestStatus
        from app.models.user import User
        
        query = select(PromotionRequest).options(
            selectinload(PromotionRequest.session),
            selectinload(PromotionRequest.class_),
            selectinload(PromotionRequest.submitter)
        ).where(
            PromotionRequest.school_id == school_id,
            PromotionRequest.status == PromotionRequestStatus.PENDING,
            PromotionRequest.is_deleted == False
        )
        
        if session_id:
            query = query.where(PromotionRequest.session_id == session_id)
        
        query = query.order_by(PromotionRequest.submitted_at.desc())
        
        result = await db.execute(query)
        requests = result.scalars().all()
        
        pending_list = []
        for req in requests:
            pending_list.append({
                "id": req.id,
                "session_id": req.session_id,
                "session_name": req.session.name if req.session else "Unknown",
                "class_id": req.class_id,
                "class_name": req.class_.name if req.class_ else "All Classes",
                "submitted_by": req.submitted_by,
                "submitter_name": f"{req.submitter.first_name} {req.submitter.last_name}" if req.submitter else "Unknown",
                "submitted_at": req.submitted_at.isoformat() if req.submitted_at else None,
                "total_decisions": len(req.decisions) if req.decisions else 0,
                "decisions": req.decisions
            })
        
        return pending_list
    
    @staticmethod
    async def approve_promotion_request(
        db: AsyncSession,
        request_id: str,
        school_id: str,
        reviewed_by: str
    ) -> BulkPromotionResult:
        """
        Approve a pending promotion request and execute the promotions.
        """
        from app.models.promotion_request import PromotionRequest, PromotionRequestStatus
        from datetime import datetime
        
        # Get the request
        result = await db.execute(
            select(PromotionRequest).where(
                PromotionRequest.id == request_id,
                PromotionRequest.school_id == school_id,
                PromotionRequest.is_deleted == False
            )
        )
        request = result.scalar_one_or_none()
        
        if not request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Promotion request not found"
            )
        
        if request.status != PromotionRequestStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Request is already {request.status.value}"
            )
        
        # Convert decisions back to PromotionDecision objects
        decisions = []
        for d in request.decisions:
            decisions.append(PromotionDecision(
                student_id=d.get('student_id'),
                class_history_id=d.get('class_history_id', ''),
                action=d.get('action', 'promote'),
                next_class_id=d.get('next_class_id'),
                remarks=d.get('remarks', 'Approved by admin')
            ))
        
        # Execute the promotions
        promotion_result = await PromotionService.promote_students(
            db, school_id, request.session_id, decisions, reviewed_by
        )
        
        # Update the request status
        request.status = PromotionRequestStatus.APPROVED
        request.reviewed_by = reviewed_by
        request.reviewed_at = datetime.utcnow()
        await db.commit()
        
        return promotion_result
    
    @staticmethod
    async def reject_promotion_request(
        db: AsyncSession,
        request_id: str,
        school_id: str,
        reviewed_by: str,
        reason: str = ""
    ) -> dict:
        """
        Reject a pending promotion request.
        """
        from app.models.promotion_request import PromotionRequest, PromotionRequestStatus
        from datetime import datetime
        
        # Get the request
        result = await db.execute(
            select(PromotionRequest).where(
                PromotionRequest.id == request_id,
                PromotionRequest.school_id == school_id,
                PromotionRequest.is_deleted == False
            )
        )
        request = result.scalar_one_or_none()
        
        if not request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Promotion request not found"
            )
        
        if request.status != PromotionRequestStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Request is already {request.status.value}"
            )
        
        # Update the request status
        request.status = PromotionRequestStatus.REJECTED
        request.reviewed_by = reviewed_by
        request.reviewed_at = datetime.utcnow()
        request.rejection_reason = reason
        await db.commit()
        
        return {
            "id": request_id,
            "status": "rejected",
            "reason": reason,
            "message": "Promotion request has been rejected"
        }
