# Authentication Flow Diagrams

## 1. School Login Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         User Journey                                 │
└─────────────────────────────────────────────────────────────────────┘

User visits: /{schoolCode}/login
         │
         ▼
┌─────────────────────────┐
│  SchoolLoginPage        │
│  - Loads school info    │
│  - Shows school branding│
│  - Staff/Student tabs   │
└───────────┬─────────────┘
            │
            ▼
    User enters credentials
            │
            ▼
┌─────────────────────────┐
│  AuthContext            │
│  schoolLogin() called   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  authService            │
│  POST /auth/school/     │
│       {code}/login      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Backend Validation     │
│  - School exists?       │
│  - Credentials valid?   │
│  - User belongs here?   │
└───────────┬─────────────┘
            │
            ▼
    ┌───────┴────────┐
    │                │
    ▼                ▼
  SUCCESS          FAILURE
    │                │
    │                ▼
    │         ┌──────────────┐
    │         │ Error Handler│
    │         │ - Set error  │
    │         │ - Show toast │
    │         └──────────────┘
    │
    ▼
┌─────────────────────────┐
│  Store in localStorage  │
│  - access_token         │
│  - refresh_token        │
│  - login_source='school'│
│  - school_code={code}   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Set AuthContext State  │
│  - setUser(userData)    │
│  - setLoginSource()     │
│  - setSchoolCode()      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Redirect to Dashboard  │
│  /{schoolCode}/dashboard│
└─────────────────────────┘
```

---

## 2. Session Restoration Flow (Page Refresh)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Page Loads / Refreshes                            │
└─────────────────────────────────────────────────────────────────────┘

Page loads
    │
    ▼
┌─────────────────────────┐
│  AuthContext            │
│  useEffect() runs       │
│  initializeAuth()       │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Check localStorage     │
│  - access_token exists? │
└───────────┬─────────────┘
            │
    ┌───────┴────────┐
    │                │
    ▼                ▼
  EXISTS         NOT EXISTS
    │                │
    │                ▼
    │         ┌──────────────┐
    │         │ User logged  │
    │         │ out - done   │
    │         └──────────────┘
    │
    ▼
┌─────────────────────────┐
│  Restore from storage   │
│  - login_source         │
│  - school_code          │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Call getCurrentUser()  │
│  GET /auth/me           │
└───────────┬─────────────┘
            │
            ▼
    ┌───────┴────────┐
    │                │
    ▼                ▼
  SUCCESS          FAILURE
    │                │
    │                ▼
    │         ┌──────────────┐
    │         │ Clear tokens │
    │         │ User logged  │
    │         │ out          │
    │         └──────────────┘
    │
    ▼
┌─────────────────────────┐
│  Set user in state      │
│  setUser(userData)      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  User authenticated     │
│  Page continues loading │
└─────────────────────────┘

Note: If access_token is expired, the API interceptor
      automatically refreshes it using refresh_token
```

---

## 3. Logout Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         User Clicks Logout                           │
└─────────────────────────────────────────────────────────────────────┘

User clicks logout button
         │
         ▼
┌─────────────────────────┐
│  AuthContext            │
│  logout() called        │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Read from localStorage │
│  - login_source         │
│  - school_code          │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Clear localStorage     │
│  - access_token         │
│  - refresh_token        │
│  - login_source         │
│  - school_code          │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Clear AuthContext      │
│  - setUser(null)        │
│  - setLoginSource(null) │
│  - setSchoolCode(null)  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Determine redirect     │
│  based on login_source  │
└───────────┬─────────────┘
            │
    ┌───────┴────────┐
    │                │
    ▼                ▼
 'school'        'platform'
    │                │
    ▼                ▼
/{code}/login    /login
```

---

## 4. Token Refresh Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    API Request with Expired Token                    │
└─────────────────────────────────────────────────────────────────────┘

User makes API request
         │
         ▼
┌─────────────────────────┐
│  API Interceptor        │
│  Adds Authorization     │
│  header with token      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Backend receives       │
│  request                │
└───────────┬─────────────┘
            │
            ▼
    ┌───────┴────────┐
    │                │
    ▼                ▼
 TOKEN VALID    TOKEN EXPIRED
    │                │
    ▼                ▼
 Process         Return 401
 request              │
    │                ▼
    │         ┌──────────────┐
    │         │ Response     │
    │         │ Interceptor  │
    │         └──────┬───────┘
    │                │
    │                ▼
    │         ┌──────────────┐
    │         │ Check if     │
    │         │ already      │
    │         │ refreshing?  │
    │         └──────┬───────┘
    │                │
    │        ┌───────┴────────┐
    │        │                │
    │        ▼                ▼
    │      YES              NO
    │        │                │
    │        ▼                ▼
    │   Queue request   Start refresh
    │        │                │
    │        │                ▼
    │        │         ┌──────────────┐
    │        │         │ POST /auth/  │
    │        │         │ refresh      │
    │        │         └──────┬───────┘
    │        │                │
    │        │        ┌───────┴────────┐
    │        │        │                │
    │        │        ▼                ▼
    │        │     SUCCESS          FAILURE
    │        │        │                │
    │        │        ▼                ▼
    │        │   New token      Clear tokens
    │        │        │          Logout user
    │        │        ▼
    │        │   Update storage
    │        │        │
    │        └────────┴────────┐
    │                          │
    │                          ▼
    │                   Retry original
    │                   request with
    │                   new token
    │                          │
    └──────────────────────────┘
                               │
                               ▼
                          Return response
                          to caller
```

---

## 5. Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Authentication Error Occurs                     │
└─────────────────────────────────────────────────────────────────────┘

Error occurs during login/auth
         │
         ▼
┌─────────────────────────┐
│  Catch block in         │
│  login function         │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Check error.response   │
│  .status                │
└───────────┬─────────────┘
            │
    ┌───────┴────────┬────────┬────────┬────────┐
    │                │        │        │        │
    ▼                ▼        ▼        ▼        ▼
  401              403      404      500    Network
Unauthorized   Forbidden  Not Found Server  Error
    │                │        │        │        │
    ▼                ▼        ▼        ▼        ▼
"Incorrect      "Access   "School   "Server  "Network
credentials"    denied"   not found" error"  error"
    │                │        │        │        │
    │                ▼        │        │        │
    │         Clear partial   │        │        │
    │         auth state      │        │        │
    │                │        │        │        │
    └────────────────┴────────┴────────┴────────┘
                     │
                     ▼
            ┌────────────────┐
            │ Set inline     │
            │ error message  │
            └────────┬───────┘
                     │
                     ▼
            ┌────────────────┐
            │ Show toast     │
            │ notification   │
            └────────┬───────┘
                     │
                     ▼
            ┌────────────────┐
            │ User sees both │
            │ inline error & │
            │ toast          │
            └────────────────┘
```

---

## 6. School Route Protection Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│              User Tries to Access School Route                       │
└─────────────────────────────────────────────────────────────────────┘

User navigates to /{schoolCode}/...
         │
         ▼
┌─────────────────────────┐
│  SchoolRoute Component  │
│  Checks authentication  │
└───────────┬─────────────┘
            │
            ▼
    ┌───────┴────────┐
    │                │
    ▼                ▼
 Loading?         User exists?
    │                │
    ▼                │
Show spinner    ┌────┴─────┐
                │          │
                ▼          ▼
              YES         NO
                │          │
                │          ▼
                │    Redirect to
                │    /{code}/login
                │
                ▼
         ┌──────────────┐
         │ Check role   │
         └──────┬───────┘
                │
        ┌───────┴────────┐
        │                │
        ▼                ▼
   Platform Admin   School User
        │                │
        ▼                ▼
   Redirect to      Check school
   /platform        matches
                         │
                 ┌───────┴────────┐
                 │                │
                 ▼                ▼
              MATCH           MISMATCH
                 │                │
                 ▼                ▼
            Allow access    Show error
                             "School Access
                              Denied"
```

---

## 7. Data Flow Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Authentication Data Flow                          │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Browser    │         │   Frontend   │         │   Backend    │
│  localStorage│◄────────┤  AuthContext │────────►│   API        │
└──────────────┘         └──────────────┘         └──────────────┘
      │                         │                         │
      │ Stores:                 │ Manages:                │ Validates:
      │ - access_token          │ - user state            │ - credentials
      │ - refresh_token         │ - loading state         │ - school access
      │ - login_source          │ - login source          │ - token validity
      │ - school_code           │ - school code           │ - permissions
      │                         │                         │
      └─────────────────────────┴─────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   React Components    │
                    │   - SchoolRoute       │
                    │   - LoginPage         │
                    │   - Dashboard         │
                    └───────────────────────┘
```

---

## Legend

```
┌─────┐
│ Box │  = Process or Component
└─────┘

   │
   ▼     = Flow direction

┌──┴──┐
│     │  = Decision point
▼     ▼

SUCCESS  = Successful outcome
FAILURE  = Error outcome
```

