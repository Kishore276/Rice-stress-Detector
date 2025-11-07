-- =====================================================
-- RESET ALL USERS - Fresh Start Script
-- =====================================================
-- This script removes all users and their associated data
-- from the rice_disease database
-- 
-- CAUTION: This will DELETE ALL user data including:
-- - All users (farmers and researchers)
-- - All farmer profiles and their data
-- - All researcher profiles and their data
-- - All prediction history
-- - All carts and cart items
-- - All orders and order items
-- - All research reports
-- - All gene expression analysis data
-- =====================================================

USE rice_disease;

-- Disable foreign key checks temporarily for clean deletion
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- DELETE ALL USER-RELATED DATA
-- =====================================================

-- Delete all research reports
DELETE FROM research_reports;

-- Delete all order items
DELETE FROM order_items;

-- Delete all orders
DELETE FROM orders;

-- Delete all cart items
DELETE FROM cart_items;

-- Delete all carts
DELETE FROM carts;

-- Delete all prediction history
DELETE FROM prediction_history;

-- Delete all farmers
DELETE FROM farmers;

-- Delete all researchers
DELETE FROM researchers;

-- Delete all users (main table)
DELETE FROM users;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- RESET AUTO INCREMENT COUNTERS
-- =====================================================

ALTER TABLE users AUTO_INCREMENT = 1;
ALTER TABLE farmers AUTO_INCREMENT = 1;
ALTER TABLE researchers AUTO_INCREMENT = 1;
ALTER TABLE prediction_history AUTO_INCREMENT = 1;
ALTER TABLE carts AUTO_INCREMENT = 1;
ALTER TABLE cart_items AUTO_INCREMENT = 1;
ALTER TABLE orders AUTO_INCREMENT = 1;
ALTER TABLE order_items AUTO_INCREMENT = 1;
ALTER TABLE research_reports AUTO_INCREMENT = 1;

-- Reset gene expression table if exists
-- ALTER TABLE rice_gene_expression AUTO_INCREMENT = 1;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if all users are deleted
SELECT 'Users count:' as Info, COUNT(*) as Count FROM users;
SELECT 'Farmers count:' as Info, COUNT(*) as Count FROM farmers;
SELECT 'Researchers count:' as Info, COUNT(*) as Count FROM researchers;
SELECT 'Predictions count:' as Info, COUNT(*) as Count FROM prediction_history;
SELECT 'Carts count:' as Info, COUNT(*) as Count FROM carts;
SELECT 'Orders count:' as Info, COUNT(*) as Count FROM orders;

-- Display success message
SELECT '✅ All users and related data have been successfully deleted!' as Status;
SELECT '✅ Database is ready for fresh user registrations!' as Status;

-- =====================================================
-- IMPORTANT NOTES:
-- =====================================================
-- 1. This script does NOT delete:
--    - Diseases
--    - Pesticides
--    - Fertilizers
--    - Research Labs
--    - Shops
--    - Shop Products (unless uncommented)
-- 
-- 2. To keep the reference data intact while removing users
-- 
-- 3. All user data including uploaded images in prediction
--    history will be removed from database (but files on
--    disk will remain - you may want to manually clean
--    the 'uploads' folder)
-- 
-- 4. Auto-increment IDs are reset to 1, so new users
--    will start from ID 1
-- =====================================================
