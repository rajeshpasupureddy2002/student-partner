-- Meetings Table
CREATE TABLE IF NOT EXISTS meetings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    meeting_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    target_role ENUM('all', 'student', 'teacher', 'parent', 'admin') DEFAULT 'all',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Update Tasks table to support role-based assignments
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS target_role ENUM('none', 'student', 'teacher') DEFAULT 'none';
ALTER TABLE tasks MODIFY COLUMN user_id INT NULL;
