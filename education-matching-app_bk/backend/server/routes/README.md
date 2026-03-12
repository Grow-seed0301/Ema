# Routes Directory Structure

This directory contains all API route handlers organized by user role and functionality.

## Directory Structure

```
routes/
├── shared/           # Shared handlers used by multiple user types
├── teacher/          # Teacher-specific route modules
├── student/          # Student-specific route modules
├── admin.ts          # Admin routes
├── teacher.ts        # Teacher routes main file (imports teacher/*)
├── student.ts        # Student routes main file (imports student/*)
└── index.ts          # Main routes entry point
```

## Shared Handlers (`/shared/`)

Contains reusable handlers that are common between teacher and student routes:

- **auth.ts** - Authentication (register, login, logout)
- **profile.ts** - Profile management (get, update, profile image)
- **password.ts** - Password reset flow
- **chat.ts** - Chat functionality (messages, read status)

### How to Use Shared Handlers

Shared handlers accept an options object to customize behavior:

```typescript
import { handleLogin } from "../shared/auth";

app.post("/api/teacher/login", async (req, res) => {
  await handleLogin(req, res, {
    userType: "teacher",
    getUserByEmail: storage.getTeacherByEmail.bind(storage),
  });
});
```

## Teacher Routes (`/teacher/`)

Teacher-specific functionality organized by feature:

- **auth.ts** - Teacher authentication
- **profile.ts** - Teacher profile management
- **password.ts** - Teacher password reset
- **schedule.ts** - Teacher availability/schedule (teacher-only feature)
- **chat.ts** - Teacher chat functionality

## Student Routes (`/student/`)

Student-specific functionality organized by feature:

- **auth.ts** - Student authentication
- **profile.ts** - Student profile management
- **password.ts** - Student password reset
- **teachers.ts** - Teacher search, favorites, reviews (student-only features)
- **bookings.ts** - Lesson bookings (student-only features)
- **chat.ts** - Student chat functionality

## Adding New Routes

### 1. If the route is shared between teacher and student:
   - Add the handler to `/shared/`
   - Use it in both teacher and student route modules

### 2. If the route is specific to one user type:
   - Add it to the appropriate directory (`/teacher/` or `/student/`)
   - Create a new file if it's a new feature area

### 3. Update the main route file:
   - Import your new route module
   - Call the registration function

Example:
```typescript
// In /teacher/newfeature.ts
export function registerTeacherNewFeatureRoutes(app: Express): void {
  app.get("/api/teacher/newfeature", async (req, res) => {
    // ... handler code
  });
}

// In /teacher.ts
import { registerTeacherNewFeatureRoutes } from "./teacher/newfeature";

export function registerTeacherRoutes(app: Express): void {
  // ... existing routes
  registerTeacherNewFeatureRoutes(app);
}
```

## Best Practices

1. **Keep modules focused** - Each file should handle one feature area
2. **Use shared handlers** - Don't duplicate code between teacher and student
3. **Follow naming conventions** - Use descriptive, consistent names
4. **Include Swagger docs** - Add OpenAPI/Swagger comments for all routes
5. **Handle errors properly** - Use `sendError()` and `sendSuccess()` helpers
6. **Validate input** - Use Zod schemas for request validation

## Related Files

- `/server/storage.ts` - Database operations
- `/server/auth.ts` - Authentication middleware
- `/server/utils/` - Utility functions (apiResponse, jwt, etc.)
