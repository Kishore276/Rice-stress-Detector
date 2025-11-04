-- =====================================================
-- SQL Script to View All Tables and Data
-- Rice Disease Detection System Database
-- =====================================================

USE rice_disease;

-- Show all tables in database
SHOW TABLES;

-- =====================================================
-- VIEW TABLE STRUCTURES
-- =====================================================

-- Users table structure
DESCRIBE users;

-- Farmers table structure
DESCRIBE farmers;

-- Researchers table structure
DESCRIBE researchers;

-- Diseases table structure
DESCRIBE diseases;

-- Pesticides table structure
DESCRIBE pesticides;

-- Fertilizers table structure
DESCRIBE fertilizers;

-- Shops table structure
DESCRIBE shops;

-- Disease-Pesticide mapping structure
DESCRIBE disease_pesticide_mapping;

-- Prediction history structure
DESCRIBE prediction_history;

-- =====================================================
-- VIEW ALL DATA FROM EACH TABLE
-- =====================================================

-- View all users
SELECT '===== USERS TABLE =====' AS '';
SELECT * FROM users;

-- View all farmers
SELECT '===== FARMERS TABLE =====' AS '';
SELECT * FROM farmers;

-- View all researchers
SELECT '===== RESEARCHERS TABLE =====' AS '';
SELECT * FROM researchers;

-- View all diseases
SELECT '===== DISEASES TABLE =====' AS '';
SELECT * FROM diseases;

-- View all pesticides
SELECT '===== PESTICIDES TABLE =====' AS '';
SELECT * FROM pesticides;

-- View all fertilizers
SELECT '===== FERTILIZERS TABLE =====' AS '';
SELECT * FROM fertilizers;

-- View all shops
SELECT '===== SHOPS TABLE =====' AS '';
SELECT * FROM shops;

-- View disease-pesticide mappings
SELECT '===== DISEASE-PESTICIDE MAPPING TABLE =====' AS '';
SELECT * FROM disease_pesticide_mapping;

-- View prediction history
SELECT '===== PREDICTION HISTORY TABLE =====' AS '';
SELECT * FROM prediction_history;

-- =====================================================
-- USEFUL QUERIES FOR DATA ANALYSIS
-- =====================================================

-- Count records in each table
SELECT '===== RECORD COUNTS =====' AS '';
SELECT 'Users' AS table_name, COUNT(*) AS count FROM users
UNION ALL
SELECT 'Farmers', COUNT(*) FROM farmers
UNION ALL
SELECT 'Researchers', COUNT(*) FROM researchers
UNION ALL
SELECT 'Diseases', COUNT(*) FROM diseases
UNION ALL
SELECT 'Pesticides', COUNT(*) FROM pesticides
UNION ALL
SELECT 'Fertilizers', COUNT(*) FROM fertilizers
UNION ALL
SELECT 'Shops', COUNT(*) FROM shops
UNION ALL
SELECT 'Disease-Pesticide Mapping', COUNT(*) FROM disease_pesticide_mapping
UNION ALL
SELECT 'Prediction History', COUNT(*) FROM prediction_history;

-- View predictions with disease names
SELECT '===== PREDICTIONS WITH DETAILS =====' AS '';
SELECT 
    ph.id,
    f.full_name AS farmer_name,
    f.city AS farmer_city,
    ph.disease_detected,
    ph.confidence_score,
    ph.prediction_date,
    ph.image_filename
FROM prediction_history ph
JOIN farmers f ON ph.farmer_id = f.id
ORDER BY ph.prediction_date DESC;

-- View disease-pesticide relationships
SELECT '===== DISEASE-PESTICIDE RELATIONSHIPS =====' AS '';
SELECT 
    d.name AS disease,
    p.name AS pesticide,
    p.dosage_per_acre,
    p.effectiveness_rating,
    p.price_per_unit,
    p.unit_type
FROM disease_pesticide_mapping dpm
JOIN diseases d ON dpm.disease_id = d.id
JOIN pesticides p ON dpm.pesticide_id = p.id
ORDER BY d.name, p.effectiveness_rating DESC;

-- View shops by type
SELECT '===== SHOPS BY TYPE =====' AS '';
SELECT 
    shop_type,
    COUNT(*) AS count,
    AVG(rating) AS avg_rating
FROM shops
GROUP BY shop_type;

-- View recent predictions by farmer
SELECT '===== RECENT PREDICTIONS BY FARMER =====' AS '';
SELECT 
    f.full_name,
    f.city,
    COUNT(ph.id) AS total_scans,
    MAX(ph.prediction_date) AS last_scan,
    AVG(ph.confidence_score) AS avg_confidence
FROM farmers f
LEFT JOIN prediction_history ph ON f.id = ph.farmer_id
GROUP BY f.id, f.full_name, f.city
ORDER BY total_scans DESC;

-- View disease statistics
SELECT '===== DISEASE DETECTION STATISTICS =====' AS '';
SELECT 
    disease_detected,
    COUNT(*) AS detection_count,
    AVG(confidence_score) AS avg_confidence,
    MAX(confidence_score) AS max_confidence,
    MIN(confidence_score) AS min_confidence
FROM prediction_history
GROUP BY disease_detected
ORDER BY detection_count DESC;
