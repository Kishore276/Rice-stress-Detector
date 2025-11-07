-- Import Synthetic Data into Database
-- This script loads the synthetic data from the text file into the rice_gene_expression table

-- First, ensure the table exists (run create_rice_analysis_table.sql first)

-- For MySQL/MariaDB on Windows:
-- Make sure to enable local_infile in MySQL configuration
-- SET GLOBAL local_infile = 1;

-- Option 1: Using LOAD DATA LOCAL INFILE (if enabled)
-- Update the file path to match your system
LOAD DATA LOCAL INFILE 'C:/Users/gyuva/Music/cap/synthetic data.txt'
INTO TABLE rice_gene_expression
FIELDS TERMINATED BY '\t'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(rice_variety, ros_level, osrmc_level, sub1a_level, cat_level, snca3_level, stress_condition)
SET researcher_id = NULL,
    submission_date = CURRENT_TIMESTAMP,
    notes = 'Imported from synthetic dataset';

-- Option 2: Python script to import data (more reliable)
-- See import_synthetic_data.py

-- Verify import
SELECT COUNT(*) as total_records FROM rice_gene_expression;
SELECT rice_variety, COUNT(*) as count FROM rice_gene_expression GROUP BY rice_variety ORDER BY count DESC;
SELECT stress_condition, COUNT(*) as count FROM rice_gene_expression GROUP BY stress_condition;

-- Sample queries to test the data
-- Get average gene expression levels by stress condition
SELECT 
    stress_condition,
    ROUND(AVG(ros_level), 4) as avg_ros,
    ROUND(AVG(osrmc_level), 4) as avg_osrmc,
    ROUND(AVG(sub1a_level), 4) as avg_sub1a,
    ROUND(AVG(cat_level), 4) as avg_cat,
    ROUND(AVG(snca3_level), 4) as avg_snca3
FROM rice_gene_expression
GROUP BY stress_condition;

-- Get statistics for a specific rice variety
SELECT 
    stress_condition,
    COUNT(*) as sample_count,
    ROUND(AVG(ros_level), 4) as avg_ros,
    ROUND(MIN(ros_level), 4) as min_ros,
    ROUND(MAX(ros_level), 4) as max_ros
FROM rice_gene_expression
WHERE rice_variety = 'IR 64'
GROUP BY stress_condition;
