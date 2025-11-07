"""
Import synthetic data into rice_gene_expression table
This script reads the synthetic data.txt file and imports it into the MySQL database
"""

import csv
from db_connect import DatabaseConnection

def import_synthetic_data():
    """Import synthetic data from text file into database"""
    
    # Initialize database connection
    db = DatabaseConnection()
    
    try:
        # Read the synthetic data file
        print("Reading synthetic data file...")
        with open('synthetic data.txt', 'r', encoding='utf-8') as file:
            # Read tab-separated values
            reader = csv.DictReader(file, delimiter='\t')
            
            # Prepare insert query
            insert_query = """
                INSERT INTO rice_gene_expression 
                (rice_variety, ros_level, osrmc_level, sub1a_level, cat_level, 
                 snca3_level, stress_condition, researcher_id, notes)
                VALUES (%s, %s, %s, %s, %s, %s, %s, NULL, %s)
            """
            
            count = 0
            batch_size = 100
            batch_data = []
            
            for row in reader:
                values = (
                    row['Rice Variety'],
                    float(row['ROS']),
                    float(row['OSRMC']),
                    float(row['SUB1A']),
                    float(row['CAT']),
                    float(row['SNCA3']),
                    row['Stress_Condition'],
                    'Imported from synthetic dataset'
                )
                
                batch_data.append(values)
                count += 1
                
                # Insert in batches for better performance
                if len(batch_data) >= batch_size:
                    for data in batch_data:
                        db.execute_query(insert_query, data)
                    print(f"Inserted {count} records...")
                    batch_data = []
            
            # Insert remaining records
            if batch_data:
                for data in batch_data:
                    db.execute_query(insert_query, data)
            
            print(f"\n✓ Successfully imported {count} records into rice_gene_expression table")
            
            # Verify import
            verify_query = "SELECT COUNT(*) FROM rice_gene_expression"
            result = db.fetch_query(verify_query)
            total_count = result[0][0] if result else 0
            
            print(f"✓ Total records in database: {total_count}")
            
            # Show statistics by stress condition
            stats_query = """
                SELECT stress_condition, COUNT(*) as count 
                FROM rice_gene_expression 
                GROUP BY stress_condition
            """
            stats = db.fetch_query(stats_query)
            
            print("\n📊 Distribution by Stress Condition:")
            for row in stats:
                print(f"   {row[0]}: {row[1]} records")
            
            # Show statistics by rice variety (top 10)
            variety_query = """
                SELECT rice_variety, COUNT(*) as count 
                FROM rice_gene_expression 
                GROUP BY rice_variety 
                ORDER BY count DESC 
                LIMIT 10
            """
            varieties = db.fetch_query(variety_query)
            
            print("\n🌾 Top 10 Rice Varieties by Record Count:")
            for i, row in enumerate(varieties, 1):
                print(f"   {i}. {row[0]}: {row[1]} records")
                
    except FileNotFoundError:
        print("✗ Error: 'synthetic data.txt' file not found")
        print("  Make sure the file is in the same directory as this script")
    except Exception as e:
        print(f"✗ Error importing data: {str(e)}")
    finally:
        db.disconnect()


if __name__ == '__main__':
    print("="*60)
    print("Rice Gene Expression Data Importer")
    print("="*60)
    print()
    
    response = input("This will import data into the rice_gene_expression table.\nContinue? (yes/no): ")
    
    if response.lower() in ['yes', 'y']:
        import_synthetic_data()
    else:
        print("Import cancelled")
