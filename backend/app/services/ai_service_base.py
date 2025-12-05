"""
Abstract base class for AI services
"""
from abc import ABC, abstractmethod
from typing import AsyncGenerator, Optional, List


class AIServiceBase(ABC):
    """Abstract base class for AI services"""

    @property
    @abstractmethod
    def model(self) -> str:
        """Get the model name/identifier"""
        pass

    @abstractmethod
    async def generate_lesson_plan_stream(
        self,
        subject: str,
        grade_level: str,
        topic: str,
        duration: int,
        learning_objectives: str,
        additional_context: Optional[str] = None,
        standards: Optional[str] = None,
        uploaded_files: Optional[List[str]] = None
    ) -> AsyncGenerator[str, None]:
        """
        Generate a lesson plan with streaming response

        Args:
            subject: Subject name (e.g., "Mathematics", "Science")
            grade_level: Grade level (e.g., "Grade 5", "10th Grade")
            topic: Specific topic for the lesson
            duration: Lesson duration in minutes
            learning_objectives: Learning objectives for the lesson
            additional_context: Any additional context or requirements
            standards: Educational standards to align with
            uploaded_files: Optional list of file URIs or paths

        Yields:
            Chunks of the generated lesson plan text
        """
        pass

    @abstractmethod
    def upload_file(self, file_path: str) -> str:
        """
        Upload a file to the AI service

        Args:
            file_path: Path to the file to upload

        Returns:
            str: File URI or path that can be used in prompts
        """
        pass

    @abstractmethod
    async def generate_assignment_stream(
        self,
        subject: str,
        grade_level: str,
        topic: str,
        assignment_type: str,
        difficulty_level: str,
        duration: str,
        learning_objectives: str,
        number_of_questions: Optional[int] = None,
        additional_context: Optional[str] = None,
        standards: Optional[str] = None,
        uploaded_files: Optional[List[str]] = None
    ) -> AsyncGenerator[str, None]:
        """
        Generate an assignment with streaming response

        Args:
            subject: Subject name
            grade_level: Grade level
            topic: Assignment topic
            assignment_type: Type (essay, project, worksheet, quiz, homework)
            difficulty_level: Difficulty (easy, medium, hard, challenging)
            duration: Duration or length
            learning_objectives: Learning objectives
            number_of_questions: Number of questions to generate (for quizzes, worksheets, etc.)
            additional_context: Additional context
            standards: Educational standards
            uploaded_files: Optional list of file URIs or paths

        Yields:
            Chunks of the generated assignment text
        """
        pass

    @abstractmethod
    async def generate_rubric_stream(
        self,
        assignment_title: str,
        subject: str,
        grade_level: str,
        rubric_type: str,
        criteria_count: int,
        performance_levels: int,
        learning_objectives: str,
        additional_context: Optional[str] = None,
        uploaded_files: Optional[List[str]] = None
    ) -> AsyncGenerator[str, None]:
        """
        Generate a rubric with streaming response

        Args:
            assignment_title: Title of the assignment
            subject: Subject name
            grade_level: Grade level
            rubric_type: Type (analytic, holistic, single-point)
            criteria_count: Number of criteria (3-10)
            performance_levels: Number of performance levels (3-5)
            learning_objectives: Learning objectives
            additional_context: Additional context
            uploaded_files: Optional list of file URIs or paths

        Yields:
            Chunks of the generated rubric text
        """
        pass

    @abstractmethod
    async def generate_cbt_test_json(
        self,
        subject: str,
        topic: str,
        difficulty_level: str,
        question_count: int,
        additional_context: Optional[str] = None
    ) -> str:
        """
        Generate a CBT test structure in JSON format

        Args:
            subject: Subject name
            topic: Test topic
            difficulty_level: Difficulty level
            question_count: Number of questions
            additional_context: Additional context

        Returns:
            str: JSON string containing the test structure
        """
        pass
