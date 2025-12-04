#!/bin/bash

# Repository Cleanup Script
# This script removes files that should be gitignored from git tracking
# and cleans up untracked files that shouldn't be in the repository

set -e

echo "=========================================="
echo "Repository Cleanup Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Remove tracked test/debug scripts from git
echo -e "${YELLOW}Step 1: Removing test/debug scripts from git tracking...${NC}"
git rm --cached backend/check_and_fix_enum.py 2>/dev/null || true
git rm --cached backend/create_grade_tables.py 2>/dev/null || true
git rm --cached backend/create_initial_terms.py 2>/dev/null || true
git rm --cached backend/create_second_test_school.py 2>/dev/null || true
git rm --cached backend/create_test_classes.py 2>/dev/null || true
git rm --cached backend/create_test_data_for_schools.py 2>/dev/null || true
git rm --cached backend/create_test_enrollments.py 2>/dev/null || true
git rm --cached backend/create_test_school_owner.py 2>/dev/null || true
git rm --cached backend/create_test_students.py 2>/dev/null || true
git rm --cached backend/create_test_subjects.py 2>/dev/null || true
git rm --cached backend/debug_students.py 2>/dev/null || true
git rm --cached backend/debug_teacher_issue.py 2>/dev/null || true
git rm --cached backend/fix_enrollments.py 2>/dev/null || true
git rm --cached backend/get_teacher_credentials.py 2>/dev/null || true
git rm --cached backend/test_ai_integration.py 2>/dev/null || true
git rm --cached backend/test_api.py 2>/dev/null || true
git rm --cached backend/test_api_call.py 2>/dev/null || true
git rm --cached backend/test_api_direct.py 2>/dev/null || true
git rm --cached backend/test_api_response.py 2>/dev/null || true
git rm --cached backend/test_assignment_generator.py 2>/dev/null || true
git rm --cached backend/test_basic.py 2>/dev/null || true
git rm --cached backend/test_password.py 2>/dev/null || true
git rm --cached backend/test_service_initialization.py 2>/dev/null || true
git rm --cached backend/test_structure.py 2>/dev/null || true
git rm --cached backend/test_system.py 2>/dev/null || true
git rm --cached backend/test_teacher_access_restrictions.py 2>/dev/null || true
git rm --cached backend/test_teacher_fixes.py 2>/dev/null || true
git rm --cached backend/update_student_emails.py 2>/dev/null || true

echo -e "${GREEN}✓ Test/debug scripts removed from git tracking${NC}"
echo ""

# Step 2: Clean up Python cache files
echo -e "${YELLOW}Step 2: Removing Python cache files...${NC}"
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete 2>/dev/null || true
find . -type f -name "*.pyo" -delete 2>/dev/null || true
echo -e "${GREEN}✓ Python cache files removed${NC}"
echo ""

# Step 3: Remove libs directory (should use venv instead)
echo -e "${YELLOW}Step 3: Removing libs/ directory...${NC}"
if [ -d "libs" ]; then
    rm -rf libs/
    echo -e "${GREEN}✓ libs/ directory removed${NC}"
else
    echo -e "${GREEN}✓ libs/ directory not found (already clean)${NC}"
fi
echo ""

# Step 4: Clean up database files
echo -e "${YELLOW}Step 4: Cleaning up database files...${NC}"
rm -f school_management.db 2>/dev/null || true
rm -f *.db 2>/dev/null || true
rm -f *.sqlite 2>/dev/null || true
rm -f *.sqlite3 2>/dev/null || true
echo -e "${GREEN}✓ Database files removed${NC}"
echo ""

# Step 5: Show current git status
echo -e "${YELLOW}Step 5: Current git status:${NC}"
echo ""
git status --short
echo ""

echo "=========================================="
echo -e "${GREEN}Cleanup Complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Review the changes with: git status"
echo "2. Review the updated .gitignore file"
echo "3. Commit the changes:"
echo "   git add .gitignore"
echo "   git commit -m 'chore: clean up repository and update .gitignore'"
echo ""
echo "Note: The test/debug scripts are still in your working directory"
echo "but are no longer tracked by git. You can delete them if not needed."
echo ""

