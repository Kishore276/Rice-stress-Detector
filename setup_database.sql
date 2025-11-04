-- Rice Disease Detection Database Setup
-- Run this script in MySQL Command Line or phpMyAdmin

-- Create database
CREATE DATABASE IF NOT EXISTS rice_disease_db;

-- Grant permissions to user 'disease'
GRANT ALL PRIVILEGES ON rice_disease_db.* TO 'disease'@'localhost';
FLUSH PRIVILEGES;

-- Use the database
USE rice_disease_db;

-- Create farmers table
CREATE TABLE IF NOT EXISTS farmers (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address TEXT,
    registered_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create research_centers table
CREATE TABLE IF NOT EXISTS research_centers (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address TEXT,
    expertise JSON,
    established VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create detections table
CREATE TABLE IF NOT EXISTS detections (
    id VARCHAR(50) PRIMARY KEY,
    farmer_id VARCHAR(20) NOT NULL,
    farmer_name VARCHAR(100),
    image_path VARCHAR(255),
    result VARCHAR(20),
    disease VARCHAR(100),
    disease_key VARCHAR(50),
    confidence DECIMAL(5, 2),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address TEXT,
    timestamp DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_farmer_id (farmer_id),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create pesticide_shops table
CREATE TABLE IF NOT EXISTS pesticide_shops (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(100),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    rating DECIMAL(2, 1),
    open_hours VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create recommendations table
CREATE TABLE IF NOT EXISTS recommendations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    detection_id VARCHAR(50),
    farmer_id VARCHAR(20),
    research_center_id VARCHAR(20),
    message TEXT,
    sent_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_farmer_id (farmer_id),
    INDEX idx_detection_id (detection_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Show created tables
SHOW TABLES;

-- Success message
SELECT 'Database setup completed successfully!' as Status;
