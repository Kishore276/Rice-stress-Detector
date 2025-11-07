"""
Quick script to check registered users in the database
"""
import sys
sys.path.append('.')

from db_connect import DatabaseConnection

def check_users():
    db = DatabaseConnection()
    db.connect()
    
    print("\n" + "="*60)
    print("REGISTERED USERS IN DATABASE")
    print("="*60 + "\n")
    
    # Get all users
    query = "SELECT id, username, email, user_type, whatsapp_number, created_at FROM users ORDER BY id DESC"
    users = db.fetch_query(query)
    
    if users:
        print(f"Total users found: {len(users)}\n")
        print(f"{'ID':<5} {'Username':<20} {'Email':<30} {'Type':<12} {'WhatsApp':<15} {'Created'}")
        print("-" * 110)
        
        for user in users:
            user_id = user[0]
            username = user[1]
            email = user[2]
            user_type = user[3]
            whatsapp = user[4]
            created = user[5]
            
            print(f"{user_id:<5} {username:<20} {email:<30} {user_type:<12} {whatsapp:<15} {created}")
    else:
        print("⚠️ No users found in database!")
    
    print("\n" + "="*60)
    
    # Get farmers
    farmer_query = """
        SELECT u.username, f.full_name, f.phone_number, f.city 
        FROM users u 
        JOIN farmers f ON u.id = f.user_id 
        WHERE u.user_type = 'farmer'
    """
    farmers = db.fetch_query(farmer_query)
    
    if farmers:
        print("\nFARMER DETAILS:")
        print("-" * 60)
        print(f"{'Username':<20} {'Full Name':<25} {'Phone':<15} {'City'}")
        print("-" * 60)
        for farmer in farmers:
            print(f"{farmer[0]:<20} {farmer[1]:<25} {farmer[2]:<15} {farmer[3]}")
    
    # Get researchers
    researcher_query = """
        SELECT u.username, r.full_name, r.organization, r.department 
        FROM users u 
        JOIN researchers r ON u.id = r.user_id 
        WHERE u.user_type = 'researcher'
    """
    researchers = db.fetch_query(researcher_query)
    
    if researchers:
        print("\nRESEARCHER DETAILS:")
        print("-" * 60)
        print(f"{'Username':<20} {'Full Name':<25} {'Organization':<20} {'Department'}")
        print("-" * 60)
        for researcher in researchers:
            print(f"{researcher[0]:<20} {researcher[1]:<25} {researcher[2]:<20} {researcher[3]}")
    
    print("\n" + "="*60 + "\n")
    
    db.disconnect()

if __name__ == "__main__":
    check_users()
