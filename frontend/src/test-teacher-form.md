# Teacher Form Testing Guide

## Test Cases for MultiStep Teacher Form

### 1. Basic Information Step
- [ ] First Name validation (required, min 2 chars)
- [ ] Last Name validation (required, min 2 chars)
- [ ] Email validation (required, valid email format)
- [ ] Phone validation (optional, valid phone format)
- [ ] Password validation (required for new teachers, min 8 chars)
- [ ] Date of birth selection
- [ ] Gender selection
- [ ] Form data persistence when navigating between steps

### 2. Professional Information Step
- [ ] Employee ID validation (required, min 3 chars)
- [ ] Employee ID suggestion generation
- [ ] Department selection from dropdown
- [ ] Position/Title input
- [ ] Experience years selection
- [ ] Qualifications textarea
- [ ] Bio textarea

### 3. Address Information Step
- [ ] Address Line 1 input
- [ ] Address Line 2 input (optional)
- [ ] City input
- [ ] State input
- [ ] Postal code validation (optional, valid format)

### 4. Navigation and Submission
- [ ] Previous button disabled on first step
- [ ] Next button advances to next step
- [ ] Form data preserved across steps
- [ ] Final step shows "Create Teacher" button
- [ ] Loading state during submission
- [ ] Success message on successful creation
- [ ] Error handling for validation errors
- [ ] Error handling for API errors

### 5. Edit Mode
- [ ] Form pre-populated with existing teacher data
- [ ] Password field hidden in edit mode
- [ ] "Update Teacher" button text in edit mode
- [ ] Successful update flow

## Manual Testing Steps

1. **Login as School Owner**
   - Use credentials: elemenx93@gmail.com / P@$w0rd

2. **Navigate to Teachers Page**
   - Go to Teachers section
   - Click "Add New Teacher" button

3. **Test Basic Information Step**
   - Fill in required fields
   - Test validation by leaving fields empty
   - Test email format validation
   - Test password requirements
   - Click "Next"

4. **Test Professional Information Step**
   - Fill in Employee ID
   - Select department
   - Add qualifications and bio
   - Click "Next"

5. **Test Address Information Step**
   - Fill in address details (optional)
   - Test postal code validation
   - Click "Create Teacher"

6. **Verify Success**
   - Check for success message
   - Verify teacher appears in list
   - Check teacher details

## Expected API Calls

### Create Teacher
```
POST /api/v1/users/staff
Content-Type: application/json
Authorization: Bearer <token>

{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@school.com",
  "password": "password123",
  "role": "teacher",
  "employee_id": "TCH2025001",
  "department": "Mathematics",
  "position": "Senior Teacher",
  "qualification": "Bachelor's in Mathematics",
  "experience_years": "5-10",
  "phone": "+1234567890",
  "address_line1": "123 Main St",
  "city": "Anytown",
  "state": "State",
  "postal_code": "12345"
}
```

### Update Teacher
```
PUT /api/v1/users/{user_id}
Content-Type: application/json
Authorization: Bearer <token>

{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@school.com",
  "role": "teacher",
  "employee_id": "TCH2025001",
  "department": "Mathematics",
  "position": "Senior Teacher",
  "qualification": "Bachelor's in Mathematics",
  "experience_years": "5-10",
  "phone": "+1234567890",
  "address_line1": "123 Main St",
  "city": "Anytown",
  "state": "State",
  "postal_code": "12345"
}
```

## Common Issues to Check

1. **CORS Issues**: Ensure backend allows frontend origin
2. **Authentication**: Verify token is included in requests
3. **Validation Errors**: Check backend validation matches frontend
4. **Network Errors**: Check if backend is running on correct port
5. **Type Mismatches**: Ensure frontend types match backend schemas
