-- Add totalLessons field to users table
ALTER TABLE users ADD COLUMN total_lessons INTEGER DEFAULT 0;

-- Update existing users to have 0 total lessons if null
UPDATE users SET total_lessons = 0 WHERE total_lessons IS NULL;
