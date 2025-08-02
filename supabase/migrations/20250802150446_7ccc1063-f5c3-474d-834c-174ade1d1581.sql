-- Update all books with sequential natural number codes starting from 1
-- This will reset all book codes to be sequential natural numbers

-- First, create a temporary sequence to assign natural numbers
-- We'll use a window function to assign row numbers
WITH book_sequence AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY stallid ORDER BY createdat, id) as new_code
  FROM books
)
UPDATE books 
SET barcode = book_sequence.new_code::text
FROM book_sequence
WHERE books.id = book_sequence.id;