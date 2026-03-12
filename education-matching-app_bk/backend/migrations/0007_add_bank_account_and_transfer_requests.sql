-- Add bank account fields to teachers table
ALTER TABLE teachers ADD COLUMN bank_name VARCHAR;
ALTER TABLE teachers ADD COLUMN branch_name VARCHAR;
ALTER TABLE teachers ADD COLUMN branch_code VARCHAR;
ALTER TABLE teachers ADD COLUMN account_type VARCHAR;
ALTER TABLE teachers ADD COLUMN account_number VARCHAR;
ALTER TABLE teachers ADD COLUMN account_holder VARCHAR;

-- Create transfer_requests table
CREATE TABLE transfer_requests (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id VARCHAR NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  transfer_fee DECIMAL(10, 2) NOT NULL DEFAULT 250,
  net_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'pending',
  request_date TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on teacher_id for faster queries
CREATE INDEX idx_transfer_requests_teacher_id ON transfer_requests(teacher_id);

-- Create index on status for admin queries
CREATE INDEX idx_transfer_requests_status ON transfer_requests(status);
