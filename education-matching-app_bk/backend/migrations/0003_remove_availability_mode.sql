-- Remove availabilityMode column and related constraints from teacher_availability table
ALTER TABLE teacher_availability DROP CONSTRAINT IF EXISTS availability_mode_check;
ALTER TABLE teacher_availability DROP CONSTRAINT IF EXISTS availability_times_check;
ALTER TABLE teacher_availability DROP COLUMN IF EXISTS availability_mode;
