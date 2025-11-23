"""
Gemini AI Service for AI-powered features
"""
import logging
from typing import AsyncGenerator, Optional, List
from google import genai
from google.genai import types
from app.core.config import settings

logger = logging.getLogger(__name__)


class GeminiService:
    """Service for interacting with Google Gemini AI"""

    def __init__(self):
        """Initialize Gemini client"""
        api_key = settings.gemini_api_key
        if not api_key:
            raise ValueError("GEMINI_API_KEY is not configured in settings")

        self.client = genai.Client(api_key=api_key)
        self.model = "gemini-2.0-flash-exp"  # Using the latest flash model
    
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
        Generate a lesson plan using Gemini AI with streaming response

        Args:
            subject: Subject name (e.g., "Mathematics", "Science")
            grade_level: Grade level (e.g., "Grade 5", "10th Grade")
            topic: Specific topic for the lesson
            duration: Lesson duration in minutes
            learning_objectives: Learning objectives for the lesson
            additional_context: Any additional context or requirements
            standards: Educational standards to align with
            uploaded_files: Optional list of file URIs uploaded to Gemini

        Yields:
            Chunks of the generated lesson plan text
        """
        file_uris_to_delete = []
        try:
            prompt_parts = []

            # Add uploaded files to the prompt if any
            if uploaded_files:
                for file_uri in uploaded_files:
                    try:
                        # Get the file object from Gemini
                        file_obj = self.client.files.get(name=file_uri)
                        prompt_parts.append(file_obj)
                        file_uris_to_delete.append(file_uri)
                        logger.info(f"Added file to prompt: {file_uri}")
                    except Exception as e:
                        logger.error(f"Error getting file {file_uri}: {str(e)}")

            # Build the text prompt
            text_prompt = self._build_lesson_plan_prompt(
                subject=subject,
                grade_level=grade_level,
                topic=topic,
                duration=duration,
                learning_objectives=learning_objectives,
                additional_context=additional_context,
                standards=standards,
                has_files=bool(uploaded_files)
            )

            prompt_parts.append(text_prompt)
            
            # System instruction for the AI
            system_instruction = """You are an expert educational consultant and curriculum designer with years of experience creating engaging, effective lesson plans.

IMPORTANT INSTRUCTIONS:
- Start directly with the lesson plan content - NO introductory phrases like "Here is a lesson plan..." or "Okay, here is..."
- End with the lesson plan content - NO concluding remarks like "This should give you..." or "Good luck!" or "Remember to..."
- Be direct and professional
- Use clear markdown formatting with proper headings

Your lesson plans should be:
- Pedagogically sound and age-appropriate
- Engaging and interactive
- Aligned with educational best practices
- Clear and easy to follow for teachers
- Include diverse teaching strategies
- Consider different learning styles
- Include assessment methods

Format your response in markdown with clear headings and sections."""

            # Generate content with streaming
            logger.info(f"Generating lesson plan for {subject} - {topic} ({grade_level})")

            response = self.client.models.generate_content_stream(
                model=self.model,
                contents=prompt_parts,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.7,  # Balanced creativity and consistency
                    top_p=0.95,
                    top_k=40,
                    max_output_tokens=4096,
                )
            )

            # Stream the response
            for chunk in response:
                if chunk.text:
                    yield chunk.text

        except Exception as e:
            logger.error(f"Error generating lesson plan: {str(e)}")
            raise Exception(f"Failed to generate lesson plan: {str(e)}")
        finally:
            # Clean up uploaded files after generation
            for file_uri in file_uris_to_delete:
                try:
                    self.client.files.delete(name=file_uri)
                    logger.info(f"Deleted file from Gemini: {file_uri}")
                except Exception as e:
                    logger.error(f"Error deleting file {file_uri}: {str(e)}")
    
    def _build_lesson_plan_prompt(
        self,
        subject: str,
        grade_level: str,
        topic: str,
        duration: int,
        learning_objectives: str,
        additional_context: Optional[str] = None,
        standards: Optional[str] = None,
        has_files: bool = False
    ) -> str:
        """Build a comprehensive prompt for lesson plan generation"""

        file_instruction = ""
        if has_files:
            file_instruction = "\n\n**Note:** Reference materials have been provided. Please review and incorporate relevant information from these documents into the lesson plan where appropriate.\n"

        prompt = f"""Create a comprehensive, detailed lesson plan with the following specifications:{file_instruction}

**Subject:** {subject}
**Grade Level:** {grade_level}
**Topic:** {topic}
**Duration:** {duration} minutes
**Learning Objectives:**
{learning_objectives}
"""
        
        if standards:
            prompt += f"""
**Educational Standards to Align With:**
{standards}
"""
        
        if additional_context:
            prompt += f"""
**Additional Context/Requirements:**
{additional_context}
"""
        
        prompt += """

Please create a detailed lesson plan that includes the following sections:

## 1. Lesson Overview
- Brief summary of the lesson
- Key concepts to be covered
- Prerequisites (if any)

## 2. Learning Objectives
- Clear, measurable learning objectives
- Aligned with the provided objectives and standards

## 3. Materials and Resources
- Required materials and equipment
- Technology needs
- Handouts or worksheets needed
- Reference materials

## 4. Lesson Structure

### Introduction/Hook (5-10 minutes)
- Engaging opening activity to capture student interest
- Connection to prior knowledge
- Preview of what students will learn

### Main Instruction (detailed breakdown by time)
- Step-by-step teaching activities
- Teacher actions and student activities
- Key questions to ask
- Differentiation strategies for diverse learners
- Formative assessment checkpoints

### Guided Practice
- Activities where students practice with teacher support
- Examples and non-examples
- Common misconceptions to address

### Independent Practice
- Activities for students to work independently or in groups
- Clear instructions and expectations

### Closure/Summary (5-10 minutes)
- Review of key concepts
- Student reflection activities
- Preview of next lesson

## 5. Assessment
- Formative assessment strategies throughout the lesson
- Summative assessment (if applicable)
- Success criteria
- How to check for understanding

## 6. Differentiation
- Strategies for struggling learners
- Extensions for advanced students
- Accommodations for special needs
- English Language Learner support

## 7. Homework/Extension Activities (if applicable)
- Meaningful practice or extension activities
- Connection to real-world applications

## 8. Teacher Notes and Tips
- Common student difficulties
- Pacing suggestions
- Alternative approaches
- Safety considerations (if applicable)

Please make the lesson plan practical, engaging, and ready to use in the classroom."""

        return prompt

    def _build_assignment_prompt(
        self,
        subject: str,
        grade_level: str,
        topic: str,
        assignment_type: str,
        difficulty_level: str,
        duration: str,
        learning_objectives: str,
        additional_context: Optional[str] = None,
        standards: Optional[str] = None,
        has_files: bool = False
    ) -> str:
        """Build a comprehensive prompt for assignment generation"""

        file_instruction = ""
        if has_files:
            file_instruction = "\n\n**Note:** Reference materials have been provided. Please review and incorporate relevant information from these documents into the assignment where appropriate.\n"

        prompt = f"""Create a comprehensive, detailed {assignment_type} assignment with the following specifications:{file_instruction}

**Subject:** {subject}
**Grade Level:** {grade_level}
**Topic:** {topic}
**Assignment Type:** {assignment_type}
**Difficulty Level:** {difficulty_level}
**Duration/Length:** {duration}
**Learning Objectives:**
{learning_objectives}
"""

        if standards:
            prompt += f"""
**Educational Standards to Align With:**
{standards}
"""

        if additional_context:
            prompt += f"""
**Additional Context/Requirements:**
{additional_context}
"""

        prompt += """

Please create a detailed assignment that includes the following sections:

## 1. Assignment Title and Overview
- Clear, engaging title
- Brief overview of the assignment
- Purpose and relevance

## 2. Learning Objectives
- What students will learn
- Skills they will develop
- How this connects to broader curriculum

## 3. Instructions
- Step-by-step instructions
- Clear expectations
- Examples or models (if appropriate)

## 4. Requirements
- Specific requirements for completion
- Format specifications
- Length or scope guidelines
- Required components

## 5. Materials and Resources
- Materials students will need
- Recommended resources
- Links or references (if applicable)

## 6. Timeline and Deadlines
- Suggested timeline for completion
- Key milestones or checkpoints
- Final deadline

## 7. Submission Guidelines
- How to submit
- Format requirements
- What to include

## 8. Grading Criteria
- How the assignment will be graded
- Point distribution
- Key evaluation areas
- Success criteria

## 9. Differentiation Suggestions
- Modifications for struggling students
- Extensions for advanced students
- Alternative approaches

## 10. Tips for Success
- Helpful hints for students
- Common pitfalls to avoid
- Strategies for excellence

Please make the assignment clear, engaging, and appropriately challenging for the specified difficulty level."""

        return prompt

    def _build_rubric_prompt(
        self,
        assignment_title: str,
        subject: str,
        grade_level: str,
        rubric_type: str,
        criteria_count: int,
        performance_levels: int,
        learning_objectives: str,
        additional_context: Optional[str] = None,
        has_files: bool = False
    ) -> str:
        """Build a comprehensive prompt for rubric generation"""

        file_instruction = ""
        if has_files:
            file_instruction = "\n\n**Note:** Assignment description or materials have been provided. Please review and create a rubric that aligns with the assignment requirements.\n"

        # Define performance level names based on count
        level_names = {
            3: ["Developing", "Proficient", "Exemplary"],
            4: ["Beginning", "Developing", "Proficient", "Exemplary"],
            5: ["Beginning", "Developing", "Proficient", "Advanced", "Exemplary"]
        }

        levels_str = ", ".join(level_names.get(performance_levels, [f"Level {i+1}" for i in range(performance_levels)]))

        prompt = f"""Create a comprehensive, detailed {rubric_type} rubric with the following specifications:{file_instruction}

**Assignment Title:** {assignment_title}
**Subject:** {subject}
**Grade Level:** {grade_level}
**Rubric Type:** {rubric_type}
**Number of Criteria:** {criteria_count}
**Performance Levels:** {performance_levels} ({levels_str})
**Learning Objectives:**
{learning_objectives}
"""

        if additional_context:
            prompt += f"""
**Additional Context/Requirements:**
{additional_context}
"""

        if rubric_type.lower() == "analytic":
            prompt += f"""

Please create a detailed analytic rubric in markdown table format with the following structure:

## Rubric Overview
- Brief description of the rubric purpose
- Total possible points
- How to use this rubric

## Grading Rubric

Create a table with:
- First column: Criteria (list {criteria_count} specific criteria)
- Subsequent columns: Performance levels ({levels_str})
- Each cell should contain:
  * Clear descriptor of performance at that level
  * Point value for that level

Example format:
| Criteria | {levels_str.split(',')[0]} | {levels_str.split(',')[1] if len(levels_str.split(',')) > 1 else 'Level 2'} | ... |
|----------|------------|------------|-----|
| Criterion 1 | Description (X pts) | Description (Y pts) | ... |

## Scoring Guide
- Total points possible
- Grade conversion (if applicable)
- Scoring instructions

## Tips for Using This Rubric
- How to apply the rubric effectively
- Common considerations
- Suggestions for feedback"""

        elif rubric_type.lower() == "holistic":
            prompt += f"""

Please create a detailed holistic rubric with the following structure:

## Rubric Overview
- Brief description of the rubric purpose
- Total possible points
- How to use this rubric

## Performance Level Descriptions

For each of the {performance_levels} performance levels ({levels_str}), provide:

### [Level Name] (X points)
- Comprehensive description of work at this level
- Key characteristics
- What distinguishes this level from others

## Scoring Guide
- Total points possible
- Grade conversion (if applicable)
- How to determine which level best fits the work

## Tips for Using This Rubric
- How to apply the rubric effectively
- Common considerations
- Suggestions for feedback"""

        elif rubric_type.lower() == "single-point":
            prompt += f"""

Please create a detailed single-point rubric with the following structure:

## Rubric Overview
- Brief description of the rubric purpose
- How to use this rubric

## Single-Point Rubric

Create a table with three columns for each of the {criteria_count} criteria:

| Criteria | Concerns/Areas for Growth | Criteria (Proficient) | Evidence of Exceeding |
|----------|---------------------------|----------------------|----------------------|
| Criterion 1 | What needs improvement | Clear standard description | What exceeds expectations |

## Scoring Guide
- How to use this rubric for grading
- Point allocation (if applicable)
- Feedback strategies

## Tips for Using This Rubric
- How to provide effective feedback
- Using this for student self-assessment
- Revision strategies"""

        prompt += """

Please ensure the rubric is:
- Clear and specific in all descriptions
- Aligned with the learning objectives
- Fair and objective
- Easy to use for both grading and student self-assessment
- Includes appropriate point values
- Professional and ready to use"""

        return prompt

    def upload_file(self, file_path: str) -> str:
        """
        Upload a file to Gemini Files API

        Args:
            file_path: Path to the file to upload

        Returns:
            str: File URI that can be used in prompts
        """
        try:
            uploaded_file = self.client.files.upload(file=file_path)
            logger.info(f"Uploaded file to Gemini: {uploaded_file.name}")
            return uploaded_file.name
        except Exception as e:
            logger.error(f"Error uploading file to Gemini: {str(e)}")
            raise Exception(f"Failed to upload file: {str(e)}")

    async def generate_assignment_stream(
        self,
        subject: str,
        grade_level: str,
        topic: str,
        assignment_type: str,
        difficulty_level: str,
        duration: str,
        learning_objectives: str,
        additional_context: Optional[str] = None,
        standards: Optional[str] = None,
        uploaded_files: Optional[List[str]] = None
    ) -> AsyncGenerator[str, None]:
        """
        Generate an assignment using Gemini AI with streaming response

        Args:
            subject: Subject name
            grade_level: Grade level
            topic: Assignment topic
            assignment_type: Type (essay, project, worksheet, quiz, homework)
            difficulty_level: Difficulty (easy, medium, hard, challenging)
            duration: Duration or length
            learning_objectives: Learning objectives
            additional_context: Additional context
            standards: Educational standards
            uploaded_files: Optional list of file URIs

        Yields:
            Chunks of the generated assignment text
        """
        try:
            prompt_parts = []
            file_uris_to_delete = []

            # Add uploaded files if any
            if uploaded_files:
                for file_uri in uploaded_files:
                    file_obj = self.client.files.get(name=file_uri)
                    prompt_parts.append(file_obj)
                    file_uris_to_delete.append(file_uri)

            # Build the text prompt
            text_prompt = self._build_assignment_prompt(
                subject, grade_level, topic, assignment_type,
                difficulty_level, duration, learning_objectives,
                additional_context, standards, bool(uploaded_files)
            )

            prompt_parts.append(text_prompt)

            # System instruction
            system_instruction = """You are an expert educational consultant and curriculum designer with years of experience creating effective assignments for teachers.

IMPORTANT INSTRUCTIONS:
- Start directly with the assignment content - NO introductory phrases like "Here is an assignment..." or "Okay, here is..."
- End with the assignment content - NO concluding remarks like "This should help..." or "Good luck!" or "Feel free to..."
- Be direct and professional
- Use clear markdown formatting with proper headings

Your assignments should be:
- Pedagogically sound and age-appropriate
- Engaging and challenging at the appropriate level
- Clear and easy to understand for students
- Include diverse assessment methods
- Consider different learning styles
- Include clear grading criteria

Format your response in markdown with clear headings and sections."""

            # Generate content with streaming
            logger.info(f"Generating assignment for {subject} - {topic} ({grade_level})")

            try:
                response = self.client.models.generate_content_stream(
                    model=self.model,
                    contents=prompt_parts,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        temperature=0.7,
                        max_output_tokens=4096,
                    )
                )

                # Stream the response
                for chunk in response:
                    if chunk.text:
                        yield chunk.text

            finally:
                # Clean up uploaded files
                for file_uri in file_uris_to_delete:
                    try:
                        self.client.files.delete(name=file_uri)
                        logger.info(f"Deleted file from Gemini: {file_uri}")
                    except Exception as e:
                        logger.warning(f"Failed to delete file {file_uri}: {str(e)}")

        except Exception as e:
            logger.error(f"Error generating assignment: {str(e)}")
            raise Exception(f"Failed to generate assignment: {str(e)}")

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
        Generate a rubric using Gemini AI with streaming response

        Args:
            assignment_title: Title of the assignment
            subject: Subject name
            grade_level: Grade level
            rubric_type: Type (analytic, holistic, single-point)
            criteria_count: Number of criteria (3-10)
            performance_levels: Number of performance levels (3-5)
            learning_objectives: Learning objectives
            additional_context: Additional context
            uploaded_files: Optional list of file URIs

        Yields:
            Chunks of the generated rubric text
        """
        try:
            prompt_parts = []
            file_uris_to_delete = []

            # Add uploaded files if any
            if uploaded_files:
                for file_uri in uploaded_files:
                    file_obj = self.client.files.get(name=file_uri)
                    prompt_parts.append(file_obj)
                    file_uris_to_delete.append(file_uri)

            # Build the text prompt
            text_prompt = self._build_rubric_prompt(
                assignment_title, subject, grade_level, rubric_type,
                criteria_count, performance_levels, learning_objectives,
                additional_context, bool(uploaded_files)
            )

            prompt_parts.append(text_prompt)

            # System instruction
            system_instruction = """You are an expert educational assessment specialist with years of experience creating effective rubrics for teachers.

IMPORTANT INSTRUCTIONS:
- Start directly with the rubric content - NO introductory phrases like "Here is a rubric..." or "Okay, here is..."
- End with the rubric content - NO concluding remarks like "This rubric should..." or "Good luck!" or "Feel free to..."
- Be direct and professional
- Use clear markdown formatting with proper headings and tables

Your rubrics should be:
- Clear and specific in criteria descriptions
- Aligned with learning objectives
- Fair and objective
- Easy to use for grading
- Helpful for student self-assessment
- Include appropriate point values

Format your response in markdown with clear headings, tables for analytic rubrics, and well-structured sections."""

            # Generate content with streaming
            logger.info(f"Generating rubric for {assignment_title} ({grade_level})")

            try:
                response = self.client.models.generate_content_stream(
                    model=self.model,
                    contents=prompt_parts,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        temperature=0.7,
                        max_output_tokens=4096,
                    )
                )

                # Stream the response
                for chunk in response:
                    if chunk.text:
                        yield chunk.text

            finally:
                # Clean up uploaded files
                for file_uri in file_uris_to_delete:
                    try:
                        self.client.files.delete(name=file_uri)
                        logger.info(f"Deleted file from Gemini: {file_uri}")
                    except Exception as e:
                        logger.warning(f"Failed to delete file {file_uri}: {str(e)}")

        except Exception as e:
            logger.error(f"Error generating rubric: {str(e)}")
            raise Exception(f"Failed to generate rubric: {str(e)}")


# Singleton instance
_gemini_service: Optional[GeminiService] = None


def get_gemini_service() -> GeminiService:
    """Get or create Gemini service instance"""
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
    return _gemini_service

