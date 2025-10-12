# Authentication System Guide

## Quick Reference

### How Authentication Works

The school management platform uses JWT-based authentication with two types of login flows:

1. **Platform Login** (`/login`) - For platform administrators
2. **School-Specific Login** (`/{schoolCode}/login`) - For school users (teachers, students, staff)

### Key Components

#### Frontend
- **AuthContext** (`frontend/src/contexts/AuthContext.tsx`) - Manages authentication state
- **SchoolRoute** (`frontend/src/components/auth/SchoolRoute.tsx`) - Protects school-specific routes
- **PlatformAdminRoute** - Protects platform admin routes
- **authService** (`frontend/src/services/authService.ts`) - Handles API calls

#### Backend
- **auth.py** (`backend/app/api/v1/endpoints/auth.py`) - Authentication endpoints
- **security.py** (`backend/app/core/security.py`) - JWT token management
- **deps.py** (`backend/app/core/deps.py`) - Authentication dependencies

---

## Common Tasks

### Adding a New Protected Route

```typescript
// For school-specific routes
<Route
  path="/:schoolCode/my-route"
  element={
    <SchoolRoute allowedRoles={['teacher', 'school_admin']}>
      <MyComponent />
    </SchoolRoute>
  }
/>

// For platform admin routes
<Route
  path="/platform/my-route"
  element={
    <PlatformAdminRoute>
      <MyComponent />
    </PlatformAdminRoute>
  }
/>
```

### Accessing Current User

```typescript
import { useAuth } from '../../contexts/AuthContext';

const MyComponent = () => {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  return <div>Welcome, {user.full_name}!</div>;
};
```

### Implementing Logout

```typescript
import { useAuth } from '../../contexts/AuthContext';

const MyComponent = () => {
  const { logout } = useAuth();
  
  const handleLogout = () => {
    // This will automatically redirect to the correct login page
    logout();
  };
  
  return <button onClick={handleLogout}>Logout</button>;
};
```

### Handling Authentication Errors

```typescript
import { useToast } from '../../hooks/useToast';

const MyComponent = () => {
  const { showError } = useToast();
  
  const handleLogin = async (credentials) => {
    try {
      await authService.login(credentials);
    } catch (error: any) {
      if (error.response?.status === 401) {
        showError('Invalid credentials', 'Login Failed');
      } else if (error.response?.status === 403) {
        showError('Access denied', 'Access Denied');
      } else {
        showError('An error occurred', 'Error');
      }
    }
  };
};
```

---

## Authentication Flow Diagrams

### School Login Flow
```
User visits /{schoolCode}/login
    ↓
Enters credentials
    ↓
Frontend calls /api/v1/auth/school/{schoolCode}/login
    ↓
Backend validates:
  - School exists and is active
  - User credentials are correct
  - User belongs to this school
    ↓
Backend returns:
  - access_token
  - refresh_token
  - user data
    ↓
Frontend stores:
  - Tokens in localStorage
  - login_source = 'school'
  - school_code = {schoolCode}
    ↓
Frontend sets user in AuthContext
    ↓
User redirected to /{schoolCode}/dashboard
```

### Session Restoration Flow
```
Page loads/refreshes
    ↓
AuthContext checks localStorage for access_token
    ↓
If token exists:
  - Restore login_source and school_code
  - Call /api/v1/auth/me to get user data
  - If token expired, API interceptor refreshes it
  - Set user in state
    ↓
If token doesn't exist or refresh fails:
  - Clear all auth data
  - User remains logged out
```

### Logout Flow
```
User clicks logout
    ↓
Read login_source and school_code from localStorage
    ↓
Clear all auth data:
  - access_token
  - refresh_token
  - login_source
  - school_code
    ↓
Clear user state in AuthContext
    ↓
Redirect based on login_source:
  - If 'school': /{school_code}/login
  - If 'platform': /login
```

---

## Error Handling Best Practices

### 1. Always Use Toast Notifications

```typescript
import { useToast } from '../../hooks/useToast';

const { showError, showSuccess } = useToast();

// On success
showSuccess('Login successful!', 'Welcome!');

// On error
showError('Invalid credentials', 'Login Failed');
```

### 2. Provide Specific Error Messages

```typescript
// ❌ Bad
setError('Error occurred');

// ✅ Good
if (error.response?.status === 401) {
  setError('Incorrect email or password. Please verify your credentials.');
} else if (error.response?.status === 403) {
  setError('You do not have access to this school. Please contact your administrator.');
}
```

### 3. Clear Partial Auth State on 403 Errors

```typescript
if (error.response?.status === 403) {
  clearAuthState(); // Prevents partial authentication
  setError('Access denied');
}
```

---

## Security Best Practices

### 1. Never Store Sensitive Data in State
- ✅ Store tokens in localStorage
- ❌ Don't store passwords anywhere
- ✅ Clear tokens on logout

### 2. Validate School Access
```typescript
// Backend validates on every request
if (user.role !== 'school_owner' && user.school_id !== requested_school_id) {
  raise HTTPException(status_code=403, detail="Access denied")
}
```

### 3. Handle Token Expiration
```typescript
// API interceptor automatically refreshes expired tokens
if (error.response?.status === 401 && !originalRequest._retry) {
  // Attempt to refresh token
  const { access_token } = await refreshToken();
  // Retry original request with new token
}
```

---

## Debugging Tips

### Check Authentication State
```typescript
// In browser console
localStorage.getItem('access_token')
localStorage.getItem('login_source')
localStorage.getItem('school_code')
```

### Decode JWT Token
```typescript
// In browser console
const token = localStorage.getItem('access_token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload);
```

### Check Token Expiration
```typescript
const token = localStorage.getItem('access_token');
const payload = JSON.parse(atob(token.split('.')[1]));
const expiresAt = new Date(payload.exp * 1000);
console.log('Token expires at:', expiresAt);
console.log('Is expired:', expiresAt < new Date());
```

### Monitor API Requests
```typescript
// Check network tab in browser DevTools
// Look for:
// - Authorization header in requests
// - 401 responses (token expired)
// - 403 responses (access denied)
// - Refresh token calls
```

---

## Common Issues and Solutions

### Issue: User logged out on page refresh
**Solution:** Ensure `login_source` and `school_code` are persisted to localStorage

### Issue: Logout redirects to wrong page
**Solution:** Check that `login_source` and `school_code` are read from localStorage, not state

### Issue: User can access wrong school
**Solution:** Backend validates school access on every request. Check SchoolRoute component.

### Issue: Token refresh fails
**Solution:** Check that refresh_token is stored in localStorage and hasn't expired

### Issue: Infinite redirect loop
**Solution:** Check that protected routes don't redirect to themselves. Ensure loading state is handled.

---

## Testing Checklist

- [ ] User can log in via platform login
- [ ] User can log in via school-specific login
- [ ] Session persists after page refresh
- [ ] Logout redirects to correct login page
- [ ] User cannot access wrong school portal
- [ ] Error messages are clear and helpful
- [ ] Toast notifications appear for errors
- [ ] Token refresh works automatically
- [ ] Expired tokens are handled gracefully
- [ ] Network errors are handled gracefully

---

## API Endpoints

### Authentication Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/login` | POST | Platform admin login |
| `/api/v1/auth/school/{code}/login` | POST | School-specific staff login |
| `/api/v1/auth/school/{code}/student/login` | POST | School-specific student login |
| `/api/v1/auth/refresh` | POST | Refresh access token |
| `/api/v1/auth/me` | GET | Get current user data |
| `/api/v1/auth/change-password` | POST | Change password |
| `/api/v1/auth/password-reset` | POST | Request password reset |
| `/api/v1/auth/password-reset/confirm` | POST | Confirm password reset |

### Request/Response Examples

#### Login Request
```json
POST /api/v1/auth/school/ABC123/login
{
  "email": "teacher@school.com",
  "password": "password123"
}
```

#### Login Response
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user_id": "uuid",
  "email": "teacher@school.com",
  "role": "teacher",
  "school_id": "school-uuid",
  "full_name": "John Doe",
  "profile_completed": true
}
```

---

## Contact

For questions or issues with authentication, please contact the development team or refer to the main documentation.

