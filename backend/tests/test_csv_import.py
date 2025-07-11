import pytest
import io
import pandas as pd
from fastapi import UploadFile
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.csv_import_service import CSVImportService
from app.models.student import Student
from app.models.academic import Class
from app.models.user import Gender
from app.schemas.student import StudentImportResult


class TestCSVImportService:
    """Test cases for CSV import service"""
    
    def test_get_csv_template_headers(self):
        """Test CSV template headers"""
        headers = CSVImportService.get_csv_template_headers()
        
        required_headers = [
            "admission_number", "first_name", "last_name", "date_of_birth",
            "gender", "address_line1", "city", "state", "postal_code", "admission_date"
        ]
        
        for header in required_headers:
            assert header in headers
    
    def test_generate_csv_template(self):
        """Test CSV template generation"""
        template = CSVImportService.generate_csv_template()
        
        # Should be valid CSV
        assert isinstance(template, str)
        assert "admission_number" in template
        assert "first_name" in template
        assert "STU001" in template  # Sample data
    
    def test_parse_date_valid_formats(self):
        """Test date parsing with valid formats"""
        # Test different valid date formats
        test_cases = [
            ("2010-05-15", "YYYY-MM-DD"),
            ("15/05/2010", "DD/MM/YYYY"),
            ("05/15/2010", "MM/DD/YYYY"),
            ("15-05-2010", "DD-MM-YYYY")
        ]
        
        for date_str, format_name in test_cases:
            result = CSVImportService.parse_date(date_str, "test_field")
            assert result is not None
            assert result.year == 2010
            assert result.month == 5
            assert result.day == 15
    
    def test_parse_date_invalid_formats(self):
        """Test date parsing with invalid formats"""
        invalid_dates = ["invalid-date", "2010-13-45", "not-a-date", ""]
        
        for date_str in invalid_dates:
            with pytest.raises(ValueError):
                CSVImportService.parse_date(date_str, "test_field")
    
    def test_validate_gender_valid(self):
        """Test gender validation with valid values"""
        test_cases = [
            ("male", Gender.MALE),
            ("MALE", Gender.MALE),
            ("m", Gender.MALE),
            ("female", Gender.FEMALE),
            ("FEMALE", Gender.FEMALE),
            ("f", Gender.FEMALE),
            ("other", Gender.OTHER),
            ("OTHER", Gender.OTHER)
        ]
        
        for input_gender, expected in test_cases:
            result = CSVImportService.validate_gender(input_gender)
            assert result == expected
    
    def test_validate_gender_invalid(self):
        """Test gender validation with invalid values"""
        invalid_genders = ["invalid", "x", "", None]
        
        for gender in invalid_genders:
            with pytest.raises(ValueError):
                CSVImportService.validate_gender(gender)
    
    @pytest.mark.asyncio
    async def test_validate_csv_file_valid(self):
        """Test CSV file validation with valid file"""
        # Create valid CSV content
        csv_content = """admission_number,first_name,last_name,date_of_birth,gender,address_line1,city,state,postal_code,admission_date
STU001,John,Doe,2010-05-15,male,123 Main St,Lagos,Lagos,100001,2024-01-15"""
        
        # Create mock UploadFile
        file_obj = io.BytesIO(csv_content.encode('utf-8'))
        upload_file = UploadFile(filename="test.csv", file=file_obj)
        
        # Test validation
        df = await CSVImportService.validate_csv_file(upload_file)
        
        assert len(df) == 1
        assert df.iloc[0]['admission_number'] == 'STU001'
        assert df.iloc[0]['first_name'] == 'John'
    
    @pytest.mark.asyncio
    async def test_validate_csv_file_missing_headers(self):
        """Test CSV file validation with missing required headers"""
        # Create CSV with missing required headers
        csv_content = """admission_number,first_name
STU001,John"""
        
        file_obj = io.BytesIO(csv_content.encode('utf-8'))
        upload_file = UploadFile(filename="test.csv", file=file_obj)
        
        # Should raise HTTPException for missing headers
        with pytest.raises(Exception):  # HTTPException
            await CSVImportService.validate_csv_file(upload_file)
    
    @pytest.mark.asyncio
    async def test_validate_csv_file_wrong_extension(self):
        """Test CSV file validation with wrong file extension"""
        csv_content = "test,data\n1,2"
        file_obj = io.BytesIO(csv_content.encode('utf-8'))
        upload_file = UploadFile(filename="test.txt", file=file_obj)
        
        with pytest.raises(Exception):  # HTTPException
            await CSVImportService.validate_csv_file(upload_file)
    
    @pytest.mark.asyncio
    async def test_validate_csv_file_empty(self):
        """Test CSV file validation with empty file"""
        csv_content = ""
        file_obj = io.BytesIO(csv_content.encode('utf-8'))
        upload_file = UploadFile(filename="test.csv", file=file_obj)
        
        with pytest.raises(Exception):  # HTTPException
            await CSVImportService.validate_csv_file(upload_file)


class TestCSVImportEndpoints:
    """Test cases for CSV import endpoints"""
    
    def test_download_template_unauthorized(self, client: TestClient):
        """Test template download without authentication"""
        response = client.get("/api/v1/students/import/template")
        assert response.status_code == 401
    
    def test_download_template_non_super_admin(self, client: TestClient, admin_headers):
        """Test template download with non-super admin user"""
        response = client.get("/api/v1/students/import/template", headers=admin_headers)
        assert response.status_code == 403
    
    def test_download_template_success(self, client: TestClient, super_admin_headers):
        """Test successful template download"""
        response = client.get("/api/v1/students/import/template", headers=super_admin_headers)
        assert response.status_code == 200
        assert response.headers["content-type"] == "text/csv; charset=utf-8"
        assert "attachment" in response.headers.get("content-disposition", "")
    
    def test_import_csv_unauthorized(self, client: TestClient):
        """Test CSV import without authentication"""
        # Create test CSV file
        csv_content = """admission_number,first_name,last_name,date_of_birth,gender,address_line1,city,state,postal_code,admission_date
STU001,John,Doe,2010-05-15,male,123 Main St,Lagos,Lagos,100001,2024-01-15"""
        
        files = {"file": ("test.csv", csv_content, "text/csv")}
        response = client.post("/api/v1/students/import", files=files)
        assert response.status_code == 401
    
    def test_import_csv_non_super_admin(self, client: TestClient, admin_headers):
        """Test CSV import with non-super admin user"""
        csv_content = """admission_number,first_name,last_name,date_of_birth,gender,address_line1,city,state,postal_code,admission_date
STU001,John,Doe,2010-05-15,male,123 Main St,Lagos,Lagos,100001,2024-01-15"""
        
        files = {"file": ("test.csv", csv_content, "text/csv")}
        response = client.post("/api/v1/students/import", files=files, headers=admin_headers)
        assert response.status_code == 403
    
    def test_import_csv_invalid_file_type(self, client: TestClient, super_admin_headers):
        """Test CSV import with invalid file type"""
        files = {"file": ("test.txt", "not a csv", "text/plain")}
        response = client.post("/api/v1/students/import", files=files, headers=super_admin_headers)
        assert response.status_code == 400
    
    def test_import_csv_file_too_large(self, client: TestClient, super_admin_headers):
        """Test CSV import with file too large"""
        # Create a large CSV content (over 10MB)
        large_content = "a" * (11 * 1024 * 1024)  # 11MB
        files = {"file": ("test.csv", large_content, "text/csv")}
        response = client.post("/api/v1/students/import", files=files, headers=super_admin_headers)
        assert response.status_code == 413
    
    def test_import_csv_success(self, client: TestClient, super_admin_headers):
        """Test successful CSV import"""
        csv_content = """admission_number,first_name,last_name,date_of_birth,gender,address_line1,city,state,postal_code,admission_date
STU999,Jane,Smith,2011-08-22,female,456 Oak Ave,Abuja,FCT,900001,2024-01-20"""
        
        files = {"file": ("test.csv", csv_content, "text/csv")}
        response = client.post("/api/v1/students/import", files=files, headers=super_admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "total_rows" in data
        assert "successful_imports" in data
        assert "failed_imports" in data
        assert "errors" in data
        assert "created_students" in data
    
    def test_import_csv_with_errors(self, client: TestClient, super_admin_headers):
        """Test CSV import with validation errors"""
        csv_content = """admission_number,first_name,last_name,date_of_birth,gender,address_line1,city,state,postal_code,admission_date
,John,Doe,2010-05-15,male,123 Main St,Lagos,Lagos,100001,2024-01-15
STU998,Jane,,2011-08-22,female,456 Oak Ave,Abuja,FCT,900001,2024-01-20"""
        
        files = {"file": ("test.csv", csv_content, "text/csv")}
        response = client.post("/api/v1/students/import", files=files, headers=super_admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["total_rows"] == 2
        assert data["failed_imports"] > 0
        assert len(data["errors"]) > 0
        
        # Check that errors contain row numbers and field information
        for error in data["errors"]:
            assert "row" in error
            assert "field" in error
            assert "error" in error


# Fixtures for testing
@pytest.fixture
def super_admin_headers(client: TestClient):
    """Create headers for super admin authentication"""
    # This would need to be implemented based on your auth system
    # For now, return mock headers
    return {"Authorization": "Bearer super_admin_token"}


@pytest.fixture
def admin_headers(client: TestClient):
    """Create headers for admin authentication"""
    # This would need to be implemented based on your auth system
    return {"Authorization": "Bearer admin_token"}
