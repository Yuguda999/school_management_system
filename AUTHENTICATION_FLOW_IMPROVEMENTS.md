# Authentication Flow Improvements

## Summary

Successfully improved the authentication flow to handle school code-based login differently from direct login, AND fixed the critical bug where school owners were stuck to a particular school and couldn't switch between schools.

## Root Cause of the Issue

**Problem 1: School Context Not Persisting**
The `/me` endpoint was returning the `user.school_id` from the database (the user's default school) instead of the `school_id` from the JWT token (the current session's school). This meant that when school owners switched schools, the frontend would still receive the old school information, making it appear as if they were "stuck" to one school.

**Problem 2: School Code Not Properly Returned**
The `/me` endpoint was not returning the `school_code` and `school_name` fields directly, forcing the frontend to extract them from the nested `school` object. This caused issues when the school code was needed for routing.

**Problem 3: School Code Not Persisted in localStorage**
When users switched schools, the school code was not being stored in localStorage, causing navigation issues and incorrect routing.

## Changes Made

### 1. Backend Changes

#### Modified: `backend/app/api/v1/endpoints/auth.py`

**Critical Fix: `/me` Endpoint (Lines 551-720)**
- **Problem 1**: The endpoint was returning `user.school_id` from the database, which is the user's default school
- **Solution 1**: Modified to use `get_school_context` dependency instead of `get_current_user_id`
- **Implementation**:
  - Extract both `user_id` and `school_id` from the JWT token using `get_school_context`
  - Access user ID via `school_context.user.id` instead of directly from `school_context.user_id`
  - For school owners, use the token's `school_id` (current session)
  - For other users, use their default `school_id` from the database
  - This ensures school owners see the correct school information after switching

- **Problem 2**: The endpoint was not returning `school_code` and `school_name` directly
- **Solution 2**: Added `school_code` and `school_name` fields to the response
- **Implementation**:
  - Extract `code` and `name` from the `school_data` object
  - Return them as top-level fields in the response for easy access
  - Applied to both User and Student responses

- **Code Changes**:
  ```python
  # Before
  async def get_current_user_info(
      current_user_id: str = Depends(get_current_user_id),
      ...
  ):
      ...
      "school_id": user.school_id,  # Always returns default school

  # After
  async def get_current_user_info(
      school_context: SchoolContext = Depends(get_school_context),
      ...
  ):
      current_user_id = school_context.user.id  # Get user ID from school_context.user
      token_school_id = school_context.school_id  # Get school ID from JWT token

      effective_school_id = token_school_id if user.role == UserRole.SCHOOL_OWNER and token_school_id else user.school_id
      ...
      "school_id": effective_school_id,  # Returns current session's school for owners
      "school_code": school_data["code"] if school_data else None,  # Direct access
      "school_name": school_data["name"] if school_data else None,  # Direct access
  ```

**School Code Login Endpoint (`/school/{school_code}/login`)**
- **Lines 230-244**: Removed school selection requirement for school owners logging in via school code
- **Behavior**: When a school owner logs in using their school's specific login page (e.g., `/GHS/login`), they are automatically logged into that school
- **Rationale**: School owners explicitly chose this school by using its login page, so no selection modal is needed

**Direct Login Endpoint (`/login`)**
- **Lines 90-114**: Kept existing behavior unchanged
- **Behavior**: School owners logging in via the general login page still see the school selection modal
- **Rationale**: Without a school code, the system needs to ask which school they want to access

### 2. Frontend Changes

#### Modified: `frontend/src/contexts/AuthContext.tsx`

**School Selection Function (`selectSchool`)**
- **Lines 392-437**: Enhanced to store school code in localStorage
- **Changes**:
  - Extract school code from `userData.school?.code` or `userData.school_code`
  - Store school code in localStorage for persistence across page reloads
  - Ensures the school code is available for routing even after refresh

**Login Functions (`login` and `schoolLogin`)**
- **Lines 208-222 and 292-308**: Store school code after successful login
- **Changes**:
  - After fetching complete user data, extract and store school code
  - Store in localStorage for persistence
  - Ensures school code is available immediately after login

#### Modified: `frontend/src/components/auth/RoleBasedRedirect.tsx`

**School Code Resolution**
- **Line 11**: Improved school code extraction logic
- **Changes**:
  - Try `urlSchoolCode` first (from URL params)
  - Then try `user?.school?.code` (from nested school object)
  - Then try `user?.school_code` (from direct field)
  - Finally fallback to `localStorage.getItem('school_code')`
- **Rationale**: Ensures school code is always available for routing, even if one source fails

#### Modified: `frontend/src/pages/auth/LoginPage.tsx`

**Post-Login Redirect Logic**
- **Lines 11-58**: Enhanced to redirect to school-specific dashboard
- **Changes**:
  - After successful login (including school selection), extract school code from user object
  - Redirect to `/{schoolCode}/dashboard` instead of `/dashboard`
  - Applies to both direct navigation and `<Navigate>` component
- **Benefit**: School owners who use `/login` and select a school are redirected to the correct school-specific URL

#### Modified: `frontend/src/components/settings/SchoolManagement.tsx`

**School Switching Logic**
- **Lines 49-78**: Improved the `handleSwitchSchool` function
- **Changes**:
  - Now finds the target school from the schools list before switching
  - Uses the school's code to navigate to the correct dashboard URL
  - Navigates to `/{schoolCode}/dashboard` instead of using the current URL's school code
- **Benefit**: Users are correctly redirected to the new school's dashboard after switching

#### Modified: Route Guards and Other Components

**ProtectedRoute, PlatformAdminRoute, StudentDashboardPage, TeacherProfileCompletionPage, TeacherSetupPage**
- **Changes**: All redirects now use school-specific URLs with school code
- **Pattern**: Extract school code from `user.school?.code || user.school_code || localStorage.getItem('school_code')`
- **Benefit**: Ensures all navigation throughout the app maintains the school code in the URL

## Implementation Details

### School Code Login Flow

```
User visits: /TEST001/login
    ↓
Enters credentials
    ↓
Backend validates ownership
    ↓
✅ Automatically logs into TEST001
    ↓
No school selection modal shown
    ↓
Redirects to /TEST001/dashboard
```

### Direct Login Flow

```
User visits: /login
    ↓
Enters credentials
    ↓
Backend checks owned schools
    ↓
Shows school selection modal
    ↓
User selects a school
    ↓
Backend creates token with school context
    ↓
Redirects to /{schoolCode}/dashboard
```

### School Switching Flow

```
User in settings page
    ↓
Clicks "Switch" on another school
    ↓
Backend validates ownership
    ↓
Creates new token with new school context
    ↓
Frontend updates user state
    ↓
Navigates to /{newSchoolCode}/dashboard
```

## Testing

### Automated Tests

Created `test_auth_flows.py` to verify all three flows:

1. **School Code Login Test**
   - ✅ PASS: School owner logged in directly without school selection
   - Verified `requires_school_selection = False`
   - Verified `school_id` is set to the school being logged into
   - Verified `available_schools = None`

2. **Direct Login Test**
   - ✅ PASS: School owner requires school selection for direct login
   - Verified `requires_school_selection = True`
   - Verified `school_id = None`
   - Verified `available_schools` contains list of owned schools

3. **School Selection Test**
   - ✅ PASS: School selected successfully
   - Verified `school_id` is set after selection
   - Verified `requires_school_selection = False` after selection

### Test Results

```
🔐 AUTHENTICATION FLOW TESTS

================================================================================
  TEST 1: School Code Login (Should Skip School Selection)
================================================================================
✅ PASS: School owner logged in directly without school selection

================================================================================
  TEST 2: Direct Login (Should Show School Selection)
================================================================================
✅ PASS: School owner requires school selection for direct login

================================================================================
  TEST 3: School Selection (After Direct Login)
================================================================================
✅ PASS: School selected successfully
```

## Benefits

1. **Improved User Experience**
   - School owners using their school-specific login page get immediate access
   - No unnecessary modal dialogs when the school context is already known
   - Faster login process for school-specific access

2. **Maintained Flexibility**
   - Direct login still allows school owners to choose which school to access
   - School switching in settings provides easy access to multiple schools
   - All flows properly handle school context and permissions

3. **Better Navigation**
   - School switching now correctly navigates to the new school's dashboard
   - Uses the actual school code from the selected school
   - Prevents navigation errors when switching between schools

## Files Modified

### Backend
1. `backend/app/api/v1/endpoints/auth.py` - Fixed `/me` endpoint to use JWT token school_id and return school_code/school_name

### Frontend - Core Authentication
2. `frontend/src/contexts/AuthContext.tsx` - Store school code in localStorage during login and school switching
3. `frontend/src/pages/auth/LoginPage.tsx` - Redirect to school-specific dashboard after login/school selection
4. `frontend/src/pages/auth/SchoolLoginPage.tsx` - Already correctly using school code (no changes needed)
5. `frontend/src/components/auth/RoleBasedRedirect.tsx` - Improved school code resolution logic
6. `frontend/src/components/settings/SchoolManagement.tsx` - School switching navigation

### Frontend - Route Guards and Redirects
7. `frontend/src/components/auth/ProtectedRoute.tsx` - Redirect to school-specific dashboard when role check fails
8. `frontend/src/components/auth/PlatformAdminRoute.tsx` - Redirect school users to school-specific dashboard
9. `frontend/src/pages/students/StudentDashboardPage.tsx` - Redirect non-students to school-specific dashboard
10. `frontend/src/pages/teachers/TeacherProfileCompletionPage.tsx` - Use school code in teacher dashboard redirects
11. `frontend/src/pages/auth/TeacherSetupPage.tsx` - Use school code after teacher invitation acceptance

### Testing
12. `test_auth_flows.py` - Automated test script (existing file)

## Backward Compatibility

All changes are backward compatible:
- Existing direct login flow works exactly as before
- Student and teacher logins are unaffected
- Platform admin login is unaffected
- Only school owner login via school code is improved

## Security Considerations

- All ownership validations remain in place
- School owners can only access schools they own
- JWT tokens properly include school context
- Session management works correctly for all flows

## Next Steps - Manual Testing Required

**Test Credentials:**
- Email: `elemenx93@gmail.com`
- Password: `26692669`
- Schools: Greenwood High School (GHS) and Brownwood (BWD)

To test the implementation manually:

1. Start the backend server:
   ```bash
   cd backend
   source venv/bin/activate
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. Start the frontend server (if not already running):
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test school code login to GHS:**
   - Visit `http://localhost:3001/GHS/login`
   - Login with the credentials above
   - ✅ Verify no school selection modal appears
   - ✅ Verify redirect to `/GHS/dashboard`
   - ✅ Verify you see "Greenwood High School" in the header

4. **Test school switching to BWD:**
   - While logged into GHS, go to Settings > My Schools
   - Click "Switch" on Brownwood (BWD)
   - ✅ Verify redirect to `/BWD/dashboard`
   - ✅ Verify you now see "Brownwood" in the header
   - ✅ Verify the school theme/branding changed

5. **Test school code login to BWD:**
   - Logout
   - Visit `http://localhost:3001/BWD/login`
   - Login with the same credentials
   - ✅ Verify no school selection modal appears
   - ✅ Verify redirect to `/BWD/dashboard`
   - ✅ Verify you see "Brownwood" in the header

6. **Test direct login:**
   - Logout
   - Visit `http://localhost:3001/login`
   - Login with the same credentials
   - ✅ Verify school selection modal appears
   - ✅ Select a school and verify redirect to that school's dashboard

7. **Test school switching back to GHS:**
   - Go to Settings > My Schools
   - Click "Switch" on Greenwood High School (GHS)
   - ✅ Verify redirect to `/GHS/dashboard`
   - ✅ Verify you now see "Greenwood High School" in the header
   - ✅ Verify the school theme/branding changed back

## Conclusion

The critical bug preventing school owners from switching between schools has been fixed by modifying the `/me` endpoint to return the school_id from the JWT token instead of the database. The authentication flow has also been improved to provide a better user experience while maintaining security and flexibility. All automated backend tests pass. Manual testing is required to verify the complete frontend flow works as expected.

