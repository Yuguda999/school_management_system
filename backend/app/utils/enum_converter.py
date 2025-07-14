"""
Utility functions for converting enum values between database and API formats
"""

def convert_enum_to_lowercase(value: str) -> str:
    """Convert uppercase enum value from database to lowercase for API"""
    if not value:
        return value
    return value.lower()

def convert_gender_enum(value: str) -> str:
    """Convert gender enum value from database format to API format"""
    if not value:
        return None
    return value.lower()

def convert_student_status_enum(value: str) -> str:
    """Convert student status enum value from database format to API format"""
    if not value:
        return 'active'  # Default value
    return value.lower()

def convert_class_level_enum(value: str) -> str:
    """Convert class level enum value from database format to API format"""
    if not value:
        return value
    return value.lower()

def convert_user_role_enum(value: str) -> str:
    """Convert user role enum value from database format to API format"""
    if not value:
        return value
    return value.lower()
