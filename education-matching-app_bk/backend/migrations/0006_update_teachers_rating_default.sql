-- Update default rating for teachers from 0 to 3
-- First, update existing teachers with rating of 0 to have rating of 3
UPDATE teachers SET rating = 3.00 WHERE rating = 0.00;

-- Then alter the column to change the default value
ALTER TABLE teachers ALTER COLUMN rating SET DEFAULT 3.00;
