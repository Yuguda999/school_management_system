# Role-Based Redirect Fix

## Issue
Users were seeing "Unknown Role" error message after logging in, even though they had valid roles (school_owner, teacher, student, etc.).

## Root Cause
The `RoleBasedRedirect` component was failing to redirect users because:
1. The `school_code` was not being added to the user object during login
2. The component relied on the school code from the URL parameter, which wasn't always present
3. No fallback mechanism to get school code from localStorage or user object

## Solution

### 1. Added `school_code` to User Object

**File**: `frontend/src/contexts/AuthContext.tsx`

Updated both `schoolLogin` and `studentLogin` functions to include `school_code` in the user object:

```typescript
const user: User = {
  id: response.user_id,
  email: response.email,
  first_name: response.full_name?.split(' ')[0] || '',
  last_name: response.full_name?.split(' ').slice(1).join(' ') || '',
  full_name: response.full_name,
  role: response.role,
  is_active: true,
  is_verified: true,
  profile_completed: response.profile_completed,
  school_id: response.school_id,
  school_code: schoolCode, // ✅ Added this line
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};
```

### 2. Enhanced RoleBasedRedirect Component

**File**: `frontend/src/components/auth/RoleBasedRedirect.tsx`

Added fallback logic to get school code from multiple sources:

```typescript
// Get school code from URL or user's school or localStorage
const schoolCode = urlSchoolCode || user?.school_code || localStorage.getItem('school_code');
```

Added comprehensive logging to debug redirect issues:
- Logs user role, school codes from different sources
- Logs redirect destinations
- Shows debug info in error messages

### 3. Enhanced RoleBasedLayout Component

**File**: `frontend/src/components/Layout/RoleBasedLayout.tsx`

Added:
- Comprehensive logging for debugging
- Better error messages with debug information
- Improved school key for re-rendering: `key={user.school?.id || user.school_id || 'no-school'}`

## Changes Made

### frontend/src/contexts/AuthContext.tsx
- Line 269: Added `school_code: schoolCode` to schoolLogin user object
- Line 346: Added `school_code: schoolCode` to studentLogin user object
- Enhanced logging to include school_code

### frontend/src/components/auth/RoleBasedRedirect.tsx
- Line 9: Changed `schoolCode` to `urlSchoolCode` for clarity
- Line 12: Added fallback logic to get school code from multiple sources
- Lines 14-22: Added comprehensive logging
- Lines 32-102: Enhanced all redirect logic with logging
- Added debug information to error messages

### frontend/src/components/Layout/RoleBasedLayout.tsx
- Lines 9-16: Added logging for component rendering
- Line 59: Improved school key for SchoolLayout
- Lines 73-78: Added debug information to error messages

## Testing

### Test Cases

1. **Student Login**:
   - ✅ Login as student via `/{schoolCode}/login`
   - ✅ Should redirect to `/{schoolCode}/student/dashboard`
   - ✅ Refresh page - should stay logged in
   - ✅ No "Unknown Role" error

2. **Teacher Login**:
   - ✅ Login as teacher via `/{schoolCode}/login`
   - ✅ Should redirect to `/{schoolCode}/dashboard`
   - ✅ Refresh page - should stay logged in
   - ✅ No "Unknown Role" error

3. **School Owner Login**:
   - ✅ Login as school owner
   - ✅ Should redirect to `/{schoolCode}/dashboard`
   - ✅ Refresh page - should stay logged in
   - ✅ No "Unknown Role" error

4. **Platform Admin Login**:
   - ✅ Login as platform admin
   - ✅ Should redirect to `/platform`
   - ✅ No school code required

### How to Test

1. **Clear browser data**:
   - Open DevTools (F12)
   - Go to Application → Storage
   - Click "Clear site data"

2. **Test each role**:
   - Login with different user roles
   - Check console for logs
   - Verify correct redirects
   - Refresh page to test persistence

3. **Check console logs**:
   - Look for logs starting with 🔄, ✅, ❌
   - Verify school code is being detected
   - Verify role is correct

## Debug Information

If you still see "Unknown Role" error, check the console for:

1. **RoleBasedRedirect logs**:
   ```
   🔄 RoleBasedRedirect: {
     role: "student",
     urlSchoolCode: "ghs",
     userSchoolCode: "ghs",
     storedSchoolCode: "ghs",
     finalSchoolCode: "ghs",
     schoolId: "..."
   }
   ```

2. **RoleBasedLayout logs**:
   ```
   🎨 RoleBasedLayout rendering: {
     loading: false,
     hasUser: true,
     role: "student",
     schoolId: "..."
   }
   ```

3. **AuthContext logs**:
   ```
   🎓 AuthContext: Setting user state: {
     id: "...",
     school_id: "...",
     school_code: "ghs",
     role: "student"
   }
   ```

## Benefits

1. **Reliable Redirects**: Multiple fallback sources for school code
2. **Better Debugging**: Comprehensive logging helps identify issues quickly
3. **Improved UX**: No more "Unknown Role" errors for valid users
4. **Persistence**: School code persists across page refreshes
5. **Transparency**: Debug information shown in error messages

## Related Files

- `frontend/src/contexts/AuthContext.tsx` - Authentication state management
- `frontend/src/components/auth/RoleBasedRedirect.tsx` - Role-based routing
- `frontend/src/components/Layout/RoleBasedLayout.tsx` - Layout selection
- `frontend/src/types/index.ts` - User type definition (already had school_code field)

## Notes

- The `school_code` field was already defined in the User type interface
- We just needed to populate it during login
- The fix maintains backward compatibility
- All existing functionality remains intact

