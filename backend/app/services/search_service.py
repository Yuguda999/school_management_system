from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Dict, Any, Optional
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.academic import Subject, Class
from app.models.school import School

class SearchService:
    @staticmethod
    def search_universal(
        db: Session, 
        query: str, 
        user: User, 
        school_id: str, 
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Perform a universal search based on the user's role and the search query.
        """
        results = []
        query = query.strip()
        if not query:
            return results

        search_term = f"%{query}%"

        # 1. School Owner / Admin Search
        if user.role in [UserRole.SCHOOL_OWNER, UserRole.SCHOOL_ADMIN]:
            results.extend(SearchService._search_students(db, search_term, school_id, limit))
            results.extend(SearchService._search_staff(db, search_term, school_id, limit))
            results.extend(SearchService._search_subjects(db, search_term, school_id, limit))
            results.extend(SearchService._search_classes(db, search_term, school_id, limit))

        # 2. Teacher Search
        elif user.role == UserRole.TEACHER:
            # Teachers can search students (ideally restricted to their classes, but for now broad search within school is often acceptable or we can restrict)
            # For strictness, let's allow searching all students in the school for now as teachers might need to look up students not in their class
            # If restriction is needed, we would join with Enrollment or Class
            results.extend(SearchService._search_students(db, search_term, school_id, limit))
            results.extend(SearchService._search_subjects(db, search_term, school_id, limit)) # All subjects or just theirs? Let's say all for visibility.

        # 3. Student Search
        elif user.role == UserRole.STUDENT:
            results.extend(SearchService._search_subjects(db, search_term, school_id, limit))
            # Students can search for teachers
            results.extend(SearchService._search_staff(db, search_term, school_id, limit, role_filter=[UserRole.TEACHER]))

        # Sort results by relevance (simple exact match could be boosted, but for now just mixing)
        # We could slice here if we want strict total limit, but we applied limit per category
        return results[:limit]

    @staticmethod
    def _search_students(db: Session, search_term: str, school_id: str, limit: int) -> List[Dict[str, Any]]:
        students = db.query(Student).filter(
            Student.school_id == school_id,
            or_(
                Student.first_name.ilike(search_term),
                Student.last_name.ilike(search_term),
                Student.middle_name.ilike(search_term),
                Student.admission_number.ilike(search_term)
            )
        ).limit(limit).all()

        return [
            {
                "id": str(student.id),
                "type": "student",
                "title": student.full_name,
                "subtitle": f"{student.admission_number} • {student.current_class_name or 'No Class'}",
                "url": f"/students/{student.id}",
                "image": student.profile_picture_url
            }
            for student in students
        ]

    @staticmethod
    def _search_staff(
        db: Session, 
        search_term: str, 
        school_id: str, 
        limit: int, 
        role_filter: Optional[List[UserRole]] = None
    ) -> List[Dict[str, Any]]:
        query = db.query(User).filter(
            User.school_id == school_id,
            or_(
                User.first_name.ilike(search_term),
                User.last_name.ilike(search_term),
                User.email.ilike(search_term)
            )
        )

        if role_filter:
            query = query.filter(User.role.in_(role_filter))
        else:
            query = query.filter(User.role.in_([UserRole.TEACHER, UserRole.SCHOOL_ADMIN]))

        staff = query.limit(limit).all()

        return [
            {
                "id": str(user.id),
                "type": "teacher" if user.role == UserRole.TEACHER else "staff",
                "title": user.full_name,
                "subtitle": user.email,
                "url": f"/settings/users?id={user.id}" if user.role != UserRole.TEACHER else f"/teachers/{user.id}", # Adjust URLs as needed
                "image": user.profile_picture_url
            }
            for user in staff
        ]

    @staticmethod
    def _search_subjects(db: Session, search_term: str, school_id: str, limit: int) -> List[Dict[str, Any]]:
        subjects = db.query(Subject).filter(
            Subject.school_id == school_id,
            or_(
                Subject.name.ilike(search_term),
                Subject.code.ilike(search_term)
            )
        ).limit(limit).all()

        return [
            {
                "id": str(subject.id),
                "type": "subject",
                "title": subject.name,
                "subtitle": subject.code,
                "url": f"/subjects", # Ideally navigate to specific subject or filter
                "image": None
            }
            for subject in subjects
        ]

    @staticmethod
    def _search_classes(db: Session, search_term: str, school_id: str, limit: int) -> List[Dict[str, Any]]:
        classes = db.query(Class).filter(
            Class.school_id == school_id,
            Class.name.ilike(search_term)
        ).limit(limit).all()

        return [
            {
                "id": str(cls.id),
                "type": "class",
                "title": cls.name,
                "subtitle": f"{cls.level} • {cls.section or ''}",
                "url": f"/classes/{cls.id}",
                "image": None
            }
            for cls in classes
        ]
