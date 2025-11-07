-- Create table for rice gene expression analysis data
CREATE TABLE IF NOT EXISTS rice_gene_expression (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rice_variety VARCHAR(100) NOT NULL,
    ros_level DECIMAL(10, 6) NOT NULL,
    osrmc_level DECIMAL(10, 6) NOT NULL,
    sub1a_level DECIMAL(10, 6) NOT NULL,
    cat_level DECIMAL(10, 6) NOT NULL,
    snca3_level DECIMAL(10, 6) NOT NULL,
    stress_condition VARCHAR(50) NOT NULL,
    researcher_id INT,
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (researcher_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_variety (rice_variety),
    INDEX idx_stress (stress_condition),
    INDEX idx_researcher (researcher_id),
    INDEX idx_date (submission_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional: Import existing synthetic data
-- LOAD DATA INFILE 'synthetic data.txt'
-- INTO TABLE rice_gene_expression
-- FIELDS TERMINATED BY '\t'
-- LINES TERMINATED BY '\n'
-- IGNORE 1 ROWS
-- (rice_variety, ros_level, osrmc_level, sub1a_level, cat_level, snca3_level, stress_condition);
