-- Add Profile and Settings columns to 'users' table

-- NOTE: These columns might already exist if you ran this before. 
-- Safely adding them requires checking existence or just ignoring errors in a raw script.
-- For now, we assume the user might need these or they are already there.

/*
ALTER TABLE users
ADD COLUMN phone VARCHAR(20) NULL,
ADD COLUMN bio TEXT NULL,
ADD COLUMN college VARCHAR(255) NULL,
ADD COLUMN major VARCHAR(255) NULL,
ADD COLUMN linkedin VARCHAR(255) NULL,
ADD COLUMN github VARCHAR(255) NULL,
ADD COLUMN notifications_email BOOLEAN DEFAULT TRUE,
ADD COLUMN notifications_push BOOLEAN DEFAULT TRUE;
*/

-- TASK TABLE
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    due_date DATETIME,
    priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
    status ENUM('pending', 'completed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    status ENUM('present', 'absent', 'holiday', 'weekoff') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_date (user_id, date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
