# Authentication System - Test Plan

## Overview
This document provides a comprehensive test plan to verify all authentication fixes are working correctly.

---

## Pre-Test Setup

### Requirements
1. Backend server running on `http://localhost:8000`
2. Frontend server running on `http://localhost:5173` (or configured port)
3. At least one school created with code (e.g., "ABC123")
4. Test users:
   - Platform admin
   - School owner
   - Teacher
   - Student

### Test Data Setup
```sql
-- Ensure you have a test school
-- School code: ABC123
-- School name: Test School

-- Test users:
-- Platform Admin: admin@platform.com / password
-- School Owner: owner@school.com / password
-- Teacher: teacher@school.com / password
-- Student: Admission Number: STU001, First Name: John
```

---

## Test Cases

### Test Suite 1: Session Persistence

#### Test 1.1: Platform Admin Session Persistence
**Steps:**
1. Navigate to `http://localhost:5173/login`
2. Login with platform admin credentials
3. Verify redirect to `/platform`
4. Open browser DevTools → Application → Local Storage
5. Verify keys exist:
   - `access_token`
   - `refresh_token`
   - `login_source` = "platform"
6. Refresh the page (F5)
7. **Expected:** User remains logged in, stays on `/platform`
8. **Actual:** ___________

**Status:** [ ] Pass [ ] Fail

---

#### Test 1.2: School Staff Session Persistence
**Steps:**
1. Navigate to `http://localhost:5173/ABC123/login`
2. Login with teacher credentials
3. Verify redirect to `/ABC123/dashboard`
4. Open browser DevTools → Application → Local Storage
5. Verify keys exist:
   - `access_token`
   - `refresh_token`
   - `login_source` = "school"
   - `school_code` = "ABC123"
6. Refresh the page (F5)
7. **Expected:** User remains logged in, stays on `/ABC123/dashboard`
8. **Actual:** ___________

**Status:** [ ] Pass [ ] Fail

---

#### Test 1.3: Student Session Persistence
**Steps:**
1. Navigate to `http://localhost:5173/ABC123/login`
2. Click "Student Login" tab
3. Login with student credentials (admission number + first name)
4. Verify redirect to `/ABC123/student/dashboard`
5. Open browser DevTools → Application → Local Storage
6. Verify keys exist:
   - `access_token`
   - `refresh_token`
   - `login_source` = "school"
   - `school_code` = "ABC123"
7. Refresh the page (F5)
8. **Expected:** User remains logged in, stays on `/ABC123/student/dashboard`
9. **Actual:** ___________

**Status:** [ ] Pass [ ] Fail

---

### Test Suite 2: Logout Redirect

#### Test 2.1: Platform Admin Logout
**Steps:**
1. Login as platform admin via `/login`
2. Navigate to any platform page
3. Refresh the page (to test localStorage persistence)
4. Click logout button
5. **Expected:** Redirected to `/login`
6. **Actual:** ___________

**Status:** [ ] Pass [ ] Fail

---

#### Test 2.2: School Staff Logout
**Steps:**
1. Login as teacher via `/ABC123/login`
2. Navigate to any school page
3. Refresh the page (to test localStorage persistence)
4. Click logout button
5. **Expected:** Redirected to `/ABC123/login`
6. **Actual:** ___________

**Status:** [ ] Pass [ ] Fail

---

#### Test 2.3: Student Logout
**Steps:**
1. Login as student via `/ABC123/login`
2. Navigate to student dashboard
3. Refresh the page (to test localStorage persistence)
4. Click logout button
5. **Expected:** Redirected to `/ABC123/login`
6. **Actual:** ___________

**Status:** [ ] Pass [ ] Fail

---

### Test Suite 3: Error Handling

#### Test 3.1: Incorrect Credentials - Staff Login
**Steps:**
1. Navigate to `/ABC123/login`
2. Enter incorrect email/password
3. Click login
4. **Expected:** 
   - Inline error message: "Incorrect email or password. Please verify your credentials."
   - Toast notification appears with title "Login Failed"
5. **Actual:** ___________

**Status:** [ ] Pass [ ] Fail

---

#### Test 3.2: Incorrect Credentials - Student Login
**Steps:**
1. Navigate to `/ABC123/login`
2. Click "Student Login" tab
3. Enter incorrect admission number or first name
4. Click login
5. **Expected:**
   - Inline error message: "Invalid admission number or first name. Please check your credentials."
   - Toast notification appears with title "Login Failed"
6. **Actual:** ___________

**Status:** [ ] Pass [ ] Fail

---

#### Test 3.3: Wrong School Access
**Steps:**
1. Login as teacher from school ABC123
2. Manually navigate to `/XYZ789/dashboard` (different school)
3. **Expected:**
   - Error page showing:
     - "School Access Denied" heading
     - Message explaining mismatch
     - Shows both school codes
     - Button to return to correct school
4. **Actual:** ___________

**Status:** [ ] Pass [ ] Fail

---

#### Test 3.4: School Not Found
**Steps:**
1. Navigate to `/INVALID/login`
2. **Expected:**
   - Error page showing "School Not Found"
   - Message: "The school code 'INVALID' does not exist or is inactive."
   - Button to go back to home
3. **Actual:** ___________

**Status:** [ ] Pass [ ] Fail

---

#### Test 3.5: Network Error Handling
**Steps:**
1. Stop the backend server
2. Navigate to `/ABC123/login`
3. Enter valid credentials
4. Click login
5. **Expected:**
   - Inline error message: "Network error. Please check your internet connection and try again."
   - Toast notification with title "Network Error"
6. **Actual:** ___________
7. Restart backend server

**Status:** [ ] Pass [ ] Fail

---

### Test Suite 4: School Isolation

#### Test 4.1: Teacher Cannot Access Other School
**Steps:**
1. Login as teacher from school ABC123
2. Try to access `/XYZ789/dashboard`
3. **Expected:** School mismatch error page
4. **Actual:** ___________

**Status:** [ ] Pass [ ] Fail

---

#### Test 4.2: Student Cannot Access Other School
**Steps:**
1. Login as student from school ABC123
2. Try to access `/XYZ789/student/dashboard`
3. **Expected:** School mismatch error page
4. **Actual:** ___________

**Status:** [ ] Pass [ ] Fail

---

#### Test 4.3: Platform Admin Cannot Access School Routes
**Steps:**
1. Login as platform admin
2. Try to access `/ABC123/dashboard`
3. **Expected:** Redirected to `/platform`
4. **Actual:** ___________

**Status:** [ ] Pass [ ] Fail

---

### Test Suite 5: Token Management

#### Test 5.1: Token Refresh on Expiration
**Steps:**
1. Login as any user
2. Open browser DevTools → Network tab
3. Wait for token to expire (30 minutes) OR manually set token expiration in localStorage
4. Make an API request (navigate to a page)
5. **Expected:**
   - Network tab shows refresh token request
   - New access token is obtained
   - Original request succeeds
   - User remains logged in
6. **Actual:** ___________

**Status:** [ ] Pass [ ] Fail

---

#### Test 5.2: Expired Refresh Token
**Steps:**
1. Login as any user
2. Manually remove refresh_token from localStorage
3. Wait for access token to expire OR manually expire it
4. Make an API request
5. **Expected:**
   - User is logged out
   - Redirected to appropriate login page
6. **Actual:** ___________

**Status:** [ ] Pass [ ] Fail

---

### Test Suite 6: Edge Cases

#### Test 6.1: Direct URL Access While Logged Out
**Steps:**
1. Ensure logged out (clear localStorage)
2. Navigate directly to `/ABC123/dashboard`
3. **Expected:** Redirected to `/ABC123/login`
4. **Actual:** ___________

**Status:** [ ] Pass [ ] Fail

---

#### Test 6.2: Multiple Tab Synchronization
**Steps:**
1. Login in Tab 1
2. Open Tab 2 with same school portal
3. Logout in Tab 1
4. Switch to Tab 2 and try to navigate
5. **Expected:** Tab 2 detects logout and redirects to login
6. **Actual:** ___________

**Status:** [ ] Pass [ ] Fail

---

#### Test 6.3: Browser Back Button After Logout
**Steps:**
1. Login and navigate to dashboard
2. Logout
3. Click browser back button
4. **Expected:** Redirected to login page (not showing cached dashboard)
5. **Actual:** ___________

**Status:** [ ] Pass [ ] Fail

---

## Browser Compatibility Testing

Test all scenarios in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Performance Testing

### Test 7.1: Login Performance
**Steps:**
1. Measure time from clicking login to dashboard load
2. **Expected:** < 2 seconds on good network
3. **Actual:** ___________

**Status:** [ ] Pass [ ] Fail

---

### Test 7.2: Session Restoration Performance
**Steps:**
1. Login and navigate to dashboard
2. Refresh page
3. Measure time to restore session
4. **Expected:** < 1 second
5. **Actual:** ___________

**Status:** [ ] Pass [ ] Fail

---

## Security Testing

### Test 8.1: Token Storage
**Steps:**
1. Login as any user
2. Open DevTools → Application → Local Storage
3. Verify tokens are stored
4. **Expected:** Tokens are in localStorage (not sessionStorage or cookies)
5. **Actual:** ___________

**Status:** [ ] Pass [ ] Fail

---

### Test 8.2: Token in API Requests
**Steps:**
1. Login as any user
2. Open DevTools → Network tab
3. Make an API request
4. Check request headers
5. **Expected:** Authorization header with Bearer token
6. **Actual:** ___________

**Status:** [ ] Pass [ ] Fail

---

## Accessibility Testing

### Test 9.1: Keyboard Navigation
**Steps:**
1. Navigate to login page
2. Use only keyboard (Tab, Enter) to login
3. **Expected:** Can complete login without mouse
4. **Actual:** ___________

**Status:** [ ] Pass [ ] Fail

---

### Test 9.2: Screen Reader Compatibility
**Steps:**
1. Enable screen reader
2. Navigate to login page
3. Attempt to login
4. **Expected:** All elements are announced correctly
5. **Actual:** ___________

**Status:** [ ] Pass [ ] Fail

---

## Test Summary

### Results
- Total Tests: ___________
- Passed: ___________
- Failed: ___________
- Pass Rate: ___________%

### Issues Found
1. ___________
2. ___________
3. ___________

### Recommendations
1. ___________
2. ___________
3. ___________

---

## Sign-off

**Tester Name:** ___________
**Date:** ___________
**Signature:** ___________

**Approved By:** ___________
**Date:** ___________
**Signature:** ___________

