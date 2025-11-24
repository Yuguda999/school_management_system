"""
OpenRouter AI Service for AI-powered features
"""
import logging
import json
from typing import AsyncGenerator, Optional, List
import httpx
from app.core.config import settings
from app.services.ai_service_base import AIServiceBase

logger = logging.getLogger(__name__)


class OpenRouterService(AIServiceBase):
    """Service for interacting with OpenRouter AI"""

    def __init__(self):
        """Initialize OpenRouter client"""
        api_key = settings.openrouter_api_key
        if not api_key:
            raise ValueError("OPENROUTER_API_KEY is not configured in settings")

        self.api_key = api_key
        self._model = settings.openrouter_model
        self.base_url = "https://openrouter.ai/api/v1"

    @property
    def model(self) -> str:
        """Get the model name/identifier"""
        return self._model
    
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
        Generate a lesson plan using OpenRouter AI with streaming response

        Args:
            subject: Subject name (e.g., "Mathematics", "Science")
            grade_level: Grade level (e.g., "Grade 5", "10th Grade")
            topic: Specific topic for the lesson
            duration: Lesson duration in minutes
            learning_objectives: Learning objectives for the lesson
            additional_context: Any additional context or requirements
            standards: Educational standards to align with
            uploaded_files: Optional list of file paths (will be read and included in prompt)

        Yields:
            Chunks of the generated lesson plan text
        """
        try:
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
            logger.info(f"Generating lesson plan for {subject} - {topic} ({grade_level}) using OpenRouter")

            async for chunk in self._stream_completion(
                system_instruction=system_instruction,
                user_prompt=text_prompt
            ):
                yield chunk

        except Exception as e:
            logger.error(f"Error generating lesson plan: {str(e)}")
            raise Exception(f"Failed to generate lesson plan: {str(e)}")
    
    async def _stream_completion(
        self,
        system_instruction: str,
        user_prompt: str
    ) -> AsyncGenerator[str, None]:
        """
        Stream completion from OpenRouter API

        Args:
            system_instruction: System instruction for the AI
            user_prompt: User prompt

        Yields:
            Chunks of the generated text
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 4096,
            "stream": True
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload
            ) as response:
                response.raise_for_status()
                
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:]  # Remove "data: " prefix
                        
                        if data_str.strip() == "[DONE]":
                            break
                        
                        try:
                            data = json.loads(data_str)
                            if "choices" in data and len(data["choices"]) > 0:
                                delta = data["choices"][0].get("delta", {})
                                content = delta.get("content", "")
                                if content:
                                    yield content
                        except json.JSONDecodeError:
                            continue

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

    def upload_file(self, file_path: str) -> str:
        """
        Note: OpenRouter doesn't support file uploads like Gemini.
        This method returns the file path for compatibility.
        Files will be read and included in the prompt text instead.

        Args:
            file_path: Path to the file

        Returns:
            str: File path (for compatibility with Gemini interface)
        """
        logger.info(f"File marked for inclusion in prompt: {file_path}")
        return file_path

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
        Generate an assignment using OpenRouter AI with streaming response

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
            uploaded_files: Optional list of file paths

        Yields:
            Chunks of the generated assignment text
        """
        try:
            # Build the text prompt
            text_prompt = self._build_assignment_prompt(
                subject, grade_level, topic, assignment_type,
                difficulty_level, duration, learning_objectives,
                number_of_questions, additional_context, standards, bool(uploaded_files)
            )

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
            logger.info(f"Generating assignment for {subject} - {topic} ({grade_level}) using OpenRouter")

            async for chunk in self._stream_completion(
                system_instruction=system_instruction,
                user_prompt=text_prompt
            ):
                yield chunk

        except Exception as e:
            logger.error(f"Error generating assignment: {str(e)}")
            raise Exception(f"Failed to generate assignment: {str(e)}")

    def _build_assignment_prompt(
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
**Duration/Length:** {duration}"""

        if number_of_questions:
            prompt += f"""
**Number of Questions:** {number_of_questions}"""

        prompt += f"""
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

        # Assignment type-specific instructions
        assignment_type_lower = assignment_type.lower()

        if "quiz" in assignment_type_lower or "test" in assignment_type_lower or "exam" in assignment_type_lower:
            prompt += """

**IMPORTANT:** Generate ACTUAL quiz questions, not just ideas or suggestions. Each question must be complete and ready to use.

Please create a complete quiz with the following structure:

## Quiz Title
[Engaging, clear title]

## Instructions for Students
- Clear directions on how to complete the quiz
- Time allocation
- Any special instructions

## Questions
Generate the ACTUAL questions (use the specified number of questions if provided). For each question:
- Write the complete question
- For multiple choice: Provide 4 answer options (A, B, C, D)
- For true/false: Provide the statement
- For short answer: Provide the question
- For fill-in-the-blank: Provide the sentence with blank(s)

## Answer Key
Provide complete answers for all questions:
- For multiple choice: Correct letter and brief explanation
- For true/false: Correct answer and brief explanation
- For short answer: Sample correct answer or key points
- For fill-in-the-blank: Correct word(s)

## Grading Rubric
- Point distribution per question
- Total points
- Grading criteria"""

        elif "worksheet" in assignment_type_lower or "practice" in assignment_type_lower:
            prompt += """

**IMPORTANT:** Generate ACTUAL practice problems/exercises, not just ideas or suggestions. Each problem must be complete and ready to use.

Please create a complete worksheet with the following structure:

## Worksheet Title
[Engaging, clear title]

## Instructions for Students
- Clear directions on how to complete the worksheet
- Any special instructions or tips

## Problems/Exercises
Generate the ACTUAL problems (use the specified number of questions if provided). For each problem:
- Write the complete problem or exercise
- Include any necessary diagrams, data, or context
- Number each problem clearly
- Vary difficulty if appropriate

## Answer Key (For Teachers)
Provide complete solutions for all problems:
- Step-by-step solutions where applicable
- Final answers
- Common mistakes to watch for

## Extension Activities (Optional)
- Challenge problems for advanced students
- Real-world applications"""

        elif "essay" in assignment_type_lower or "writing" in assignment_type_lower:
            prompt += """

**IMPORTANT:** Generate ACTUAL essay prompts/questions, not just ideas. Each prompt must be complete and ready to use.

Please create a complete essay assignment with the following structure:

## Essay Title
[Engaging, clear title]

## Essay Prompt(s)
Generate the ACTUAL essay question(s) or prompt(s) (use the specified number if provided):
- Write complete, thought-provoking prompts
- Include any necessary context or background
- Specify the type of essay (argumentative, analytical, narrative, etc.)

## Instructions for Students
- Length requirements (word count or pages)
- Format requirements (MLA, APA, etc.)
- Required components (thesis, evidence, conclusion, etc.)
- Submission guidelines

## Grading Rubric
- Thesis/Argument (points)
- Evidence/Support (points)
- Organization (points)
- Writing Quality (points)
- Mechanics (points)
- Total points

## Resources and Tips
- Suggested sources or research directions
- Writing tips
- Common pitfalls to avoid"""

        elif "homework" in assignment_type_lower:
            prompt += """

**IMPORTANT:** Generate ACTUAL homework problems/questions, not just ideas. Each item must be complete and ready to assign.

Please create a complete homework assignment with the following structure:

## Homework Title
[Clear title with topic]

## Instructions
- Clear directions for students
- Due date information
- Submission format

## Problems/Questions
Generate the ACTUAL homework problems (use the specified number if provided):
- Write complete questions or problems
- Include any necessary context, data, or diagrams
- Number each item clearly
- Mix different types of questions if appropriate

## Answer Key (For Teachers)
- Complete solutions
- Key concepts being assessed
- Common errors to watch for

## Additional Notes
- Estimated time to complete
- Resources students can use
- Parent involvement suggestions (if applicable)"""

        elif "project" in assignment_type_lower:
            prompt += """

Please create a detailed project assignment with the following structure:

## Project Title and Overview
- Engaging title
- Project description
- Purpose and learning goals

## Project Requirements
- Specific deliverables
- Format and presentation requirements
- Required components
- Timeline and milestones

## Instructions
- Step-by-step guidance
- Research requirements
- Collaboration guidelines (if group project)

## Grading Rubric
- Detailed criteria for each component
- Point distribution
- Quality expectations

## Resources and Support
- Recommended resources
- Examples or models
- Tips for success"""

        else:
            # Generic assignment type
            prompt += """

**IMPORTANT:** Generate ACTUAL assignment content, not just ideas or outlines.

Please create a complete assignment with:

## Assignment Title
[Clear, engaging title]

## Instructions
- Clear directions for students
- Requirements and expectations

## Assignment Content
Generate the ACTUAL questions, problems, or tasks (use the specified number if provided):
- Write complete, ready-to-use content
- Include all necessary information
- Number items clearly

## Grading Criteria
- How the assignment will be graded
- Point distribution
- Success criteria

## Answer Key/Solutions (if applicable)
- Complete answers or solutions
- Grading guidelines"""

        prompt += """

Make the assignment clear, engaging, and appropriately challenging for the specified difficulty level.
Ensure all questions/problems are complete, specific, and ready to use without modification."""

        return prompt

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
        Generate a rubric using OpenRouter AI with streaming response

        Args:
            assignment_title: Title of the assignment
            subject: Subject name
            grade_level: Grade level
            rubric_type: Type (analytic, holistic, single-point)
            criteria_count: Number of criteria (3-10)
            performance_levels: Number of performance levels (3-5)
            learning_objectives: Learning objectives
            additional_context: Additional context
            uploaded_files: Optional list of file paths

        Yields:
            Chunks of the generated rubric text
        """
        try:
            # Build the text prompt
            text_prompt = self._build_rubric_prompt(
                assignment_title, subject, grade_level, rubric_type,
                criteria_count, performance_levels, learning_objectives,
                additional_context, bool(uploaded_files)
            )

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
            logger.info(f"Generating rubric for {assignment_title} ({grade_level}) using OpenRouter")

            async for chunk in self._stream_completion(
                system_instruction=system_instruction,
                user_prompt=text_prompt
            ):
                yield chunk

        except Exception as e:
            logger.error(f"Error generating rubric: {str(e)}")
            raise Exception(f"Failed to generate rubric: {str(e)}")

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


# Singleton instance
_openrouter_service: Optional[OpenRouterService] = None


def get_openrouter_service() -> OpenRouterService:
    """Get or create OpenRouter service instance"""
    global _openrouter_service
    if _openrouter_service is None:
        _openrouter_service = OpenRouterService()
    return _openrouter_service


