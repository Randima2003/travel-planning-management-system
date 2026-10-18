CREATE TABLE IF NOT EXISTS traveler_trips (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    traveler_id BIGINT UNSIGNED NOT NULL,
    destination VARCHAR(150) NOT NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    visibility ENUM('friends', 'private', 'public') NOT NULL DEFAULT 'friends',
    budget DECIMAL(12,2) NOT NULL DEFAULT 0,
    activities JSON NOT NULL,
    status ENUM('planning', 'upcoming', 'completed') NOT NULL DEFAULT 'planning',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_traveler_trip_user FOREIGN KEY (traveler_id) REFERENCES users(id) ON DELETE CASCADE
);
