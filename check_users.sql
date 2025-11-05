-- =====================================================
-- Check Registered Users in Rice Disease Database
-- =====================================================

USE rice_disease;

-- Show all registered users with their details
SELECT 
    u.id,
    u.username,
    u.email,
    u.user_type,
    u.whatsapp_number,
    u.created_at,
    CASE 
        WHEN u.user_type = 'farmer' THEN f.full_name
        WHEN u.user_type = 'researcher' THEN r.full_name
        ELSE 'N/A'
    END AS full_name
FROM users u
LEFT JOIN farmers f ON u.id = f.user_id
LEFT JOIN researchers r ON u.id = r.user_id
ORDER BY u.id DESC;

-- Count users by type
SELECT 
    user_type,
    COUNT(*) as total_users
FROM users
GROUP BY user_type;

-- Show farmers with details
SELECT 
    u.username,
    u.email,
    f.full_name,
    f.phone_number,
    f.city,
    f.state,
    u.created_at
FROM users u
JOIN farmers f ON u.id = f.user_id
WHERE u.user_type = 'farmer'
ORDER BY u.id DESC;

-- Show researchers with details
SELECT 
    u.username,
    u.email,
    r.full_name,
    r.organization,
    r.department,
    u.created_at
FROM users u
JOIN researchers r ON u.id = r.user_id
WHERE u.user_type = 'researcher'
ORDER BY u.id DESC;
