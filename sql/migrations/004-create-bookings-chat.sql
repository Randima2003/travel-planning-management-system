CREATE TABLE IF NOT EXISTS bookings (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    trip_id INT NOT NULL,
    traveler_id BIGINT UNSIGNED NOT NULL,
    guide_id BIGINT UNSIGNED NOT NULL,
    offered_budget DECIMAL(12,2) NOT NULL DEFAULT 0,
    counter_offer DECIMAL(12,2) NULL,
    request_message VARCHAR(1200) NOT NULL DEFAULT '',
    status ENUM('pending', 'countered', 'accepted', 'declined', 'completed') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_booking_trip FOREIGN KEY (trip_id) REFERENCES traveler_trips(id) ON DELETE CASCADE,
    CONSTRAINT fk_booking_traveler FOREIGN KEY (traveler_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_booking_guide FOREIGN KEY (guide_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_trip_guide_booking (trip_id, guide_id)
);

CREATE TABLE IF NOT EXISTS booking_messages (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    sender_id BIGINT UNSIGNED NOT NULL,
    body VARCHAR(2000) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME NULL,
    INDEX idx_booking_messages (booking_id, id),
    CONSTRAINT fk_message_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_message_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);
