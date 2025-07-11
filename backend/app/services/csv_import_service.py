import pandas as pd
import io
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, UploadFile
from app.models.student import Student, StudentStatus
from app.models.academic import Class
from app.models.user import Gender
from app.schemas.student import (
    CSVStudentRow, 
    StudentCreate, 
    StudentImportResult, 
    StudentImportError,
    StudentResponse
)


class CSVImportService:
    """Service for handling CSV import of students"""

    @staticmethod
    def _safe_string_value(value) -> Optional[str]:
        """Safely convert pandas value to string, handling NaN values"""
        if value is None or pd.isna(value):
            return None
        str_value = str(value).strip()
        if str_value.lower() in ['nan', 'none', '']:
            return None
        return str_value

    @staticmethod
    def get_csv_template_headers() -> List[str]:
        """Get the headers for the CSV template"""
        return [
            "admission_number",
            "first_name", 
            "last_name",
            "middle_name",
            "date_of_birth",
            "gender",
            "phone",
            "email",
            "address_line1",
            "address_line2", 
            "city",
            "state",
            "postal_code",
            "admission_date",
            "current_class_name",
            "guardian_name",
            "guardian_phone",
            "guardian_email",
            "guardian_relationship",
            "emergency_contact_name",
            "emergency_contact_phone", 
            "emergency_contact_relationship",
            "medical_conditions",
            "allergies",
            "blood_group",
            "notes"
        ]
    
    @staticmethod
    def generate_csv_template() -> str:
        """Generate a CSV template with headers and sample data"""
        headers = CSVImportService.get_csv_template_headers()

        # Create sample data rows with instructions
        sample_data = [
            # First row with sample data
            [
                "STU001",  # admission_number - Must be unique
                "John",    # first_name - Required
                "Doe",     # last_name - Required
                "Michael", # middle_name - Optional
                "2010-05-15",  # date_of_birth - Required (YYYY-MM-DD format)
                "male",    # gender - Required (male/female/other)
                "+1234567890",  # phone - Optional
                "john.doe@example.com",  # email - Optional (leave empty if not available)
                "123 Main Street",  # address_line1 - Required
                "Apt 4B",  # address_line2 - Optional
                "Lagos",   # city - Required
                "Lagos",   # state - Required
                "100001",  # postal_code - Required
                "2024-01-15",  # admission_date - Required (YYYY-MM-DD format)
                "Class 5A",  # current_class_name - Optional (must exist in system, leave empty if not assigning)
                "Jane Doe",  # guardian_name - Optional
                "+1234567891",  # guardian_phone - Optional
                "jane.doe@example.com",  # guardian_email - Optional
                "Mother",  # guardian_relationship - Optional
                "Bob Smith",  # emergency_contact_name - Optional
                "+1234567892",  # emergency_contact_phone - Optional
                "Uncle",   # emergency_contact_relationship - Optional
                "None",    # medical_conditions - Optional
                "Peanuts", # allergies - Optional
                "O+",      # blood_group - Optional
                "Excellent student"  # notes - Optional
            ],
            # Second row with another example
            [
                "STU002",
                "Jane",
                "Smith",
                "",  # Empty middle name
                "2011-08-22",
                "female",
                "",  # Empty phone (optional)
                "",  # Empty email (optional)
                "456 Oak Avenue",
                "",  # Empty address line 2
                "Abuja",
                "FCT",
                "900001",
                "2024-01-20",
                "",  # No class assigned yet (optional)
                "Robert Smith",
                "+1234567893",
                "robert.smith@example.com",
                "Father",
                "Mary Johnson",
                "+1234567894",
                "Aunt",
                "Asthma",
                "None",
                "A+",
                "New student"
            ]
        ]

        # Create DataFrame and convert to CSV (using comma separator for better compatibility)
        df = pd.DataFrame(sample_data, columns=headers)
        return df.to_csv(index=False, sep=',')
    
    @staticmethod
    async def validate_csv_file(file: UploadFile) -> pd.DataFrame:
        """Validate and parse CSV file"""
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="File must be a CSV file")

        try:
            # Read file content
            content = await file.read()
            content_str = content.decode('utf-8')

            # Try to detect separator (comma or tab)
            try:
                # First try with comma separator
                df = pd.read_csv(io.StringIO(content_str), sep=',')
                # If we get only one column, it might be tab-separated
                if len(df.columns) == 1:
                    df = pd.read_csv(io.StringIO(content_str), sep='\t')
            except:
                # If comma fails, try tab separator
                df = pd.read_csv(io.StringIO(content_str), sep='\t')

            # Check if DataFrame is empty
            if df.empty:
                raise HTTPException(status_code=400, detail="CSV file is empty")
            
            # Validate required headers
            required_headers = ["admission_number", "first_name", "last_name", 
                              "date_of_birth", "gender", "address_line1", 
                              "city", "state", "postal_code", "admission_date"]
            
            missing_headers = [h for h in required_headers if h not in df.columns]
            if missing_headers:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Missing required columns: {', '.join(missing_headers)}"
                )
            
            return df
            
        except pd.errors.EmptyDataError:
            raise HTTPException(status_code=400, detail="CSV file is empty")
        except pd.errors.ParserError as e:
            raise HTTPException(status_code=400, detail=f"Error parsing CSV file: {str(e)}")
        except UnicodeDecodeError:
            raise HTTPException(status_code=400, detail="File encoding not supported. Please use UTF-8")
    
    @staticmethod
    def parse_date(date_str: str, field_name: str) -> Optional[date]:
        """Parse date string to date object"""
        if pd.isna(date_str) or not date_str:
            return None
            
        try:
            # Try different date formats
            for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%d-%m-%Y']:
                try:
                    return datetime.strptime(str(date_str).strip(), fmt).date()
                except ValueError:
                    continue
            raise ValueError(f"Invalid date format for {field_name}")
        except Exception:
            raise ValueError(f"Invalid date format for {field_name}")
    
    @staticmethod
    def validate_gender(gender_str: str) -> Gender:
        """Validate and convert gender string"""
        if pd.isna(gender_str) or not gender_str:
            raise ValueError("Gender is required")
        
        gender_lower = str(gender_str).lower().strip()
        gender_mapping = {
            'male': Gender.MALE,
            'm': Gender.MALE,
            'female': Gender.FEMALE,
            'f': Gender.FEMALE,
            'other': Gender.OTHER
        }
        
        if gender_lower not in gender_mapping:
            raise ValueError(f"Invalid gender: {gender_str}. Must be male, female, or other")
        
        return gender_mapping[gender_lower]
    
    @staticmethod
    async def resolve_class_name_to_id(class_name: str, school_id: str, db: AsyncSession) -> Optional[str]:
        """Resolve class name to class ID"""
        if not class_name or pd.isna(class_name):
            return None

        # Clean the class name
        clean_class_name = str(class_name).strip()
        if not clean_class_name or clean_class_name.lower() in ['nan', 'none', '']:
            return None

        result = await db.execute(
            select(Class).where(
                Class.name == clean_class_name,
                Class.school_id == school_id,
                Class.is_deleted == False
            )
        )
        class_obj = result.scalar_one_or_none()
        return class_obj.id if class_obj else None
    
    @staticmethod
    async def validate_admission_number_unique(
        admission_number: str,
        school_id: str,
        db: AsyncSession,
        existing_numbers: set = None
    ) -> bool:
        """Check if admission number is unique"""
        if existing_numbers and admission_number in existing_numbers:
            return False

        result = await db.execute(
            select(Student).where(
                Student.admission_number == admission_number,
                Student.school_id == school_id,
                Student.is_deleted == False
            )
        )
        return result.scalar_one_or_none() is None

    @staticmethod
    async def process_csv_import(
        file: UploadFile,
        school_id: str,
        db: AsyncSession
    ) -> StudentImportResult:
        """Process CSV file and import students"""
        try:
            # Validate and parse CSV
            df = await CSVImportService.validate_csv_file(file)

            errors: List[StudentImportError] = []
            created_students: List[StudentResponse] = []
            existing_admission_numbers = set()

            # Pre-load existing admission numbers for better performance
            existing_result = await db.execute(
                select(Student.admission_number).where(
                    Student.school_id == school_id,
                    Student.is_deleted == False
                )
            )
            existing_admission_numbers.update([row[0] for row in existing_result.fetchall()])

            # Process each row
            for index, row in df.iterrows():
                row_number = index + 2  # +2 because pandas is 0-indexed and we skip header

                try:
                    # Validate and convert row data
                    student_data = await CSVImportService.validate_and_convert_row(
                        row, row_number, school_id, db, existing_admission_numbers
                    )

                    if student_data:
                        # Create student
                        student = Student(**student_data)
                        db.add(student)
                        await db.flush()  # Flush to get ID but don't commit yet

                        # Add to existing numbers to prevent duplicates in same file
                        existing_admission_numbers.add(student_data['admission_number'])

                        # Create response object
                        from app.api.v1.endpoints.students import enhance_student_response
                        student_response = await enhance_student_response(student, db)
                        created_students.append(student_response)

                except ValueError as ve:
                    # Validation error - extract field and value if possible
                    error_msg = str(ve)
                    field = "general"
                    value = ""

                    # Try to extract field name from error message
                    if "admission_number" in error_msg.lower():
                        field = "admission_number"
                        value = str(row.get('admission_number', ''))
                    elif "first_name" in error_msg.lower():
                        field = "first_name"
                        value = str(row.get('first_name', ''))
                    elif "last_name" in error_msg.lower():
                        field = "last_name"
                        value = str(row.get('last_name', ''))
                    elif "date_of_birth" in error_msg.lower():
                        field = "date_of_birth"
                        value = str(row.get('date_of_birth', ''))
                    elif "gender" in error_msg.lower():
                        field = "gender"
                        value = str(row.get('gender', ''))
                    elif "email" in error_msg.lower():
                        field = "email"
                        value = str(row.get('email', ''))
                    elif "guardian_email" in error_msg.lower():
                        field = "guardian_email"
                        value = str(row.get('guardian_email', ''))
                    elif "class" in error_msg.lower():
                        field = "current_class_name"
                        value = str(row.get('current_class_name', ''))

                    errors.append(StudentImportError(
                        row=row_number,
                        field=field,
                        value=value,
                        error=error_msg.replace(f"Row {row_number}: ", "")
                    ))

                except Exception as e:
                    # Unexpected error
                    errors.append(StudentImportError(
                        row=row_number,
                        field="general",
                        value="",
                        error=f"Unexpected error: {str(e)}"
                    ))

            # Commit all successful imports or rollback if none succeeded
            if created_students:
                await db.commit()
            else:
                await db.rollback()

            return StudentImportResult(
                total_rows=len(df),
                successful_imports=len(created_students),
                failed_imports=len(errors),
                errors=errors,
                created_students=created_students
            )

        except HTTPException:
            # Re-raise HTTP exceptions (file validation errors)
            raise
        except Exception as e:
            # Rollback on any unexpected error
            await db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Error processing CSV file: {str(e)}"
            )

    @staticmethod
    async def validate_and_convert_row(
        row: pd.Series,
        row_number: int,
        school_id: str,
        db: AsyncSession,
        existing_numbers: set
    ) -> Optional[Dict[str, Any]]:
        """Validate and convert a single CSV row to student data"""
        import re  # Import re module at the beginning
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'  # Define email pattern once

        try:
            # Required fields validation with detailed error messages
            admission_number = str(row.get('admission_number', '')).strip()
            if not admission_number:
                raise ValueError("Admission number is required and cannot be empty")

            # Validate admission number format (alphanumeric, max 50 chars)
            if len(admission_number) > 50:
                raise ValueError(f"Admission number '{admission_number}' is too long (maximum 50 characters)")

            # Check uniqueness
            is_unique = await CSVImportService.validate_admission_number_unique(
                admission_number, school_id, db, existing_numbers
            )
            if not is_unique:
                raise ValueError(f"Admission number '{admission_number}' already exists in the system or appears multiple times in this file")

            first_name = str(row.get('first_name', '')).strip()
            if not first_name:
                raise ValueError("First name is required and cannot be empty")
            if len(first_name) > 100:
                raise ValueError(f"First name '{first_name}' is too long (maximum 100 characters)")

            last_name = str(row.get('last_name', '')).strip()
            if not last_name:
                raise ValueError("Last name is required and cannot be empty")
            if len(last_name) > 100:
                raise ValueError(f"Last name '{last_name}' is too long (maximum 100 characters)")

            # Parse dates
            date_of_birth = CSVImportService.parse_date(row.get('date_of_birth'), 'date_of_birth')
            if not date_of_birth:
                raise ValueError("Date of birth is required")

            admission_date = CSVImportService.parse_date(row.get('admission_date'), 'admission_date')
            if not admission_date:
                raise ValueError("Admission date is required")

            # Validate gender
            gender = CSVImportService.validate_gender(row.get('gender'))

            # Required address fields
            address_line1 = str(row.get('address_line1', '')).strip()
            if not address_line1:
                raise ValueError("Address line 1 is required")

            city = str(row.get('city', '')).strip()
            if not city:
                raise ValueError("City is required")

            state = str(row.get('state', '')).strip()
            if not state:
                raise ValueError("State is required")

            postal_code = str(row.get('postal_code', '')).strip()
            if not postal_code:
                raise ValueError("Postal code is required")

            # Validate email format if provided
            email = None
            email_value = row.get('email')
            if email_value is not None and not pd.isna(email_value):
                email = str(email_value).strip()
                if email and email.lower() != 'nan':  # Handle pandas NaN representation
                    if not re.match(email_pattern, email):
                        raise ValueError(f"Invalid email format: '{email}'")
                else:
                    email = None

            # Validate guardian email format if provided
            guardian_email = None
            guardian_email_value = row.get('guardian_email')
            if guardian_email_value is not None and not pd.isna(guardian_email_value):
                guardian_email = str(guardian_email_value).strip()
                if guardian_email and guardian_email.lower() != 'nan':  # Handle pandas NaN representation
                    if not re.match(email_pattern, guardian_email):
                        raise ValueError(f"Invalid guardian email format: '{guardian_email}'")
                else:
                    guardian_email = None

            # Resolve class name to ID
            current_class_id = None
            class_name = CSVImportService._safe_string_value(row.get('current_class_name'))
            if class_name:  # Only process if we have a valid class name
                current_class_id = await CSVImportService.resolve_class_name_to_id(
                    class_name, school_id, db
                )
                if current_class_id is None:
                    raise ValueError(f"Class '{class_name}' not found in the system")

            # Build student data dictionary
            student_data = {
                'admission_number': admission_number,
                'first_name': first_name,
                'last_name': last_name,
                'middle_name': CSVImportService._safe_string_value(row.get('middle_name')),
                'date_of_birth': date_of_birth,
                'gender': gender,
                'phone': CSVImportService._safe_string_value(row.get('phone')),
                'email': email,
                'address_line1': address_line1,
                'address_line2': CSVImportService._safe_string_value(row.get('address_line2')),
                'city': city,
                'state': state,
                'postal_code': postal_code,
                'admission_date': admission_date,
                'current_class_id': current_class_id,
                'status': StudentStatus.ACTIVE,
                'school_id': school_id,

                # Optional fields
                'guardian_name': CSVImportService._safe_string_value(row.get('guardian_name')),
                'guardian_phone': CSVImportService._safe_string_value(row.get('guardian_phone')),
                'guardian_email': guardian_email,
                'guardian_relationship': CSVImportService._safe_string_value(row.get('guardian_relationship')),
                'emergency_contact_name': CSVImportService._safe_string_value(row.get('emergency_contact_name')),
                'emergency_contact_phone': CSVImportService._safe_string_value(row.get('emergency_contact_phone')),
                'emergency_contact_relationship': CSVImportService._safe_string_value(row.get('emergency_contact_relationship')),
                'medical_conditions': CSVImportService._safe_string_value(row.get('medical_conditions')),
                'allergies': CSVImportService._safe_string_value(row.get('allergies')),
                'blood_group': CSVImportService._safe_string_value(row.get('blood_group')),
                'notes': CSVImportService._safe_string_value(row.get('notes')),
            }

            return student_data

        except Exception as e:
            raise ValueError(f"Row {row_number}: {str(e)}")
