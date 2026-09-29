-- Signup --
INSERT INTO users (username, email, password_hash)
VALUES (?, ?, ?)

-- Login --
SELECT user_id, username, email, password_hash
FROM users
WHERE username = ?

-- Get current user --
SELECT user_id, username, email, created_at
FROM users
WHERE user_id = ?

-- Check email --
SELECT user_id
FROM users
WHERE email = ?
  AND user_id != ?

-- Update email --
SELECT user_id
FROM users
WHERE email = ?
  AND user_id != ?

-- Get password hash --
SELECT password_hash
FROM users
WHERE user_id = ?

-- Update password --
UPDATE users
SET password_hash = ?
WHERE user_id = ?

-- Check user --
SELECT user_id
FROM users
WHERE user_id = ?

-- Delete historical saved flights when account is deleted --
DELETE FROM saved_flights
WHERE user_id = ?

-- Delete upcoming saved flights when account is deleted --
DELETE FROM upcoming_saved_flights
WHERE user_id = ?

-- Delete user --
DELETE FROM users
WHERE user_id = ?