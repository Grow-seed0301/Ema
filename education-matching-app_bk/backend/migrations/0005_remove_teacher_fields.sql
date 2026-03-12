-- Remove pricePerHour, education, and achievements columns from teachers table
ALTER TABLE teachers DROP COLUMN IF EXISTS price_per_hour;
ALTER TABLE teachers DROP COLUMN IF EXISTS education;
ALTER TABLE teachers DROP COLUMN IF EXISTS achievements;
