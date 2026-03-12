# Database Migration Guide: Separate Teachers Table

This guide explains the database schema changes made to separate teachers from the users table.

## Summary of Changes

### 1. Database Schema Changes (backend/shared/schema.ts)

- **Created new `teachers` table**: Contains all teacher data, merging fields from `users` and `teacher_profiles`
- **Updated `users` table**: Removed `role` field - now contains only student data
- **Removed `teacher_profiles` table**: All teacher-specific fields are now in the `teachers` table
- **Updated foreign keys**: All references to teachers now point to the `teachers` table instead of `users`

### 2. Affected Tables and Foreign Keys

Tables with foreign key updates:
- `bookings.teacherId` → now references `teachers.id`
- `reviews.teacherId` → now references `teachers.id`
- `favorites.teacherId` → now references `teachers.id`
- `teacher_availability.teacherId` → now references `teachers.id`

## Migration Steps

### Step 1: Backup Database
```bash
# Create a backup before making any changes
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### Step 2: Data Migration Script

Before pushing schema changes, you need to migrate existing data. Create and run this migration:

```sql
-- Create teachers table (this will be done automatically by drizzle-kit push)

-- Migrate teacher data from users to teachers
INSERT INTO teachers (
  id, email, password, name, first_name, last_name, phone,
  avatar_url, profile_image_url, avatar_color, date_of_birth,
  gender, address, bio,
  specialty, subjects, price_per_hour, education, experience,
  teaching_styles, achievements, rating, review_count,
  total_students, total_lessons, favorite_count, is_verified,
  is_active, created_at, updated_at
)
SELECT 
  u.id, u.email, u.password, u.name, u.first_name, u.last_name, u.phone,
  u.avatar_url, u.profile_image_url, u.avatar_color, u.date_of_birth,
  u.gender, u.address, u.bio,
  tp.specialty, tp.subjects, tp.price_per_hour, tp.education, tp.experience,
  tp.teaching_styles, tp.achievements, tp.rating, tp.review_count,
  tp.total_students, tp.total_lessons, tp.favorite_count, tp.is_verified,
  u.is_active, u.created_at, u.updated_at
FROM users u
LEFT JOIN teacher_profiles tp ON u.id = tp.user_id
WHERE u.role = 'teacher';

-- Delete teacher records from users table
DELETE FROM users WHERE role = 'teacher';

-- Remove role column from users table (optional - drizzle-kit will handle this)
-- ALTER TABLE users DROP COLUMN role;
```

### Step 3: Push Schema Changes

```bash
cd backend
npm run db:push
# or
npx drizzle-kit push
```

### Step 4: Verify Migration

After migration, verify:

```sql
-- Check teacher count
SELECT COUNT(*) FROM teachers;

-- Check that no teachers remain in users
SELECT COUNT(*) FROM users WHERE role = 'teacher'; -- Should error or return 0

-- Verify foreign key constraints
SELECT * FROM bookings LIMIT 1;
SELECT * FROM reviews LIMIT 1;
SELECT * FROM favorites LIMIT 1;
```

## Code Changes Made

### Backend Changes

1. **Storage Layer** (`backend/server/storage.ts`):
   - Added new methods: `getTeacher`, `createTeacher`, `updateTeacher`, `deleteTeacher`
   - Updated all methods that query teachers to use the `teachers` table
   - Updated return types to use `Teacher` instead of `User` where appropriate

2. **API Routes**:
   - **Teacher Routes** (`backend/server/routes/teacher.ts`): Updated registration, login, and profile management
   - **Student Routes** (`backend/server/routes/student.ts`): Updated teacher search and favorites
   - **Admin Routes** (`backend/server/routes/admin.ts`): Updated teacher management endpoints

3. **Types**: Added new `Teacher`, `InsertTeacher`, and `UpsertTeacher` types

## Testing Checklist

After migration, test the following:

- [ ] Teacher registration
- [ ] Teacher login
- [ ] Teacher profile updates (including specialty, subjects, etc.)
- [ ] Student search for teachers
- [ ] Student favorites teachers
- [ ] Booking creation (student-teacher relationship)
- [ ] Reviews (student reviewing teacher)
- [ ] Admin teacher management
- [ ] Dashboard statistics (teacher count)

## Rollback Plan

If issues arise, you can rollback:

1. Restore from backup:
```bash
psql $DATABASE_URL < backup_YYYYMMDD.sql
```

2. Revert code changes using git:
```bash
git revert <commit-sha>
```

## Frontend Impact

The frontend code has NOT been updated yet. The following areas will need updates:

1. API service calls that reference teacher data
2. Screens that display teacher information
3. Any type definitions that assume teachers are users with a role field

Note: The API responses are designed to minimize breaking changes, but frontend types may need updates.

## Important Notes

- The `teacher_profiles` table and related code have been completely removed
- All teacher-related code should use the `teachers` table directly
- The `users` table no longer has a `role` field - it's implicitly "student" for all records
