-- Add isRecommended field to plans table
ALTER TABLE plans ADD COLUMN is_recommended BOOLEAN DEFAULT false;
