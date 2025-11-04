import mysql.connector

conn = mysql.connector.connect(
    host='127.0.0.1',
    user='root',
    password='Kishore@276',
    database='rice_disease'
)

cursor = conn.cursor()

# Check shops count
cursor.execute('SELECT COUNT(*) FROM shops')
print(f'Total shops: {cursor.fetchone()[0]}')

# Check sample shops
cursor.execute('SELECT name, city, shop_type, latitude, longitude FROM shops LIMIT 5')
print('\nSample shops:')
for row in cursor.fetchall():
    print(f'  - {row[0]} ({row[2]}) in {row[1]} at [{row[3]}, {row[4]}]')

# Check diseases table structure
cursor.execute("SHOW COLUMNS FROM diseases")
print('\nDiseases table columns:')
for row in cursor.fetchall():
    print(f'  - {row[0]} ({row[1]})')

conn.close()
