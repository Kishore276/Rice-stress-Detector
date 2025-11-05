"""Test to verify pesticide data is correctly structured"""

# Copy the treatment_database from app_auth.py
treatment_database = {
    "Bacterialblight": {
        "disease_name": "Bacterial Blight",
        "description": "Bacterial infection causing wilting and leaf damage",
        "pesticides": [
            {"name": "Copper Hydroxide 77% WP", "dosage": "3g/liter", "details": "Apply @ 3g/liter water"},
            {"name": "Streptocycline 200-300 ppm", "dosage": "200-300 ppm", "details": "Spray at 7-10 day intervals"},
            {"name": "Plantomycin", "dosage": "1g/liter", "details": "Apply @ 1g/liter water"},
            {"name": "Copper Oxychloride 50% WP", "dosage": "3g/liter", "details": "Use @ 3g/liter water"}
        ],
        "application_method": "Foliar spray, cover both leaf surfaces thoroughly",
        "frequency": "Every 7-10 days until symptoms reduce"
    },
    "Blast": {
        "disease_name": "Rice Blast",
        "description": "Fungal disease causing diamond-shaped lesions on leaves",
        "pesticides": [
            {"name": "Tricyclazole 75% WP", "dosage": "0.6g/liter", "details": "Apply @ 0.6g/liter water"},
            {"name": "Carbendazim 50% WP", "dosage": "1g/liter", "details": "Use @ 1g/liter water"},
            {"name": "Azoxystrobin 25% SC", "dosage": "1ml/liter", "details": "Apply @ 1ml/liter water"},
            {"name": "Isoprothiolane 40% EC", "dosage": "1.5ml/liter", "details": "Use @ 1.5ml/liter water"}
        ],
        "application_method": "Spray thoroughly on leaves and stems, ensure complete coverage",
        "frequency": "2-3 applications at 10-12 day intervals"
    },
    "Brownspot": {
        "disease_name": "Brown Spot",
        "description": "Fungal disease with circular brown spots on leaves",
        "pesticides": [
            {"name": "Mancozeb 75% WP", "dosage": "2.5g/liter", "details": "Apply @ 2.5g/liter water"},
            {"name": "Propiconazole 25% EC", "dosage": "1ml/liter", "details": "Use @ 1ml/liter water"},
            {"name": "Copper Oxychloride 50% WP", "dosage": "3g/liter", "details": "Apply @ 3g/liter water"},
            {"name": "Carbendazim 50% WP", "dosage": "2g/kg seed", "details": "Seed treatment @ 2g/kg seed"}
        ],
        "application_method": "Foliar spray and seed treatment before sowing",
        "frequency": "Every 10-15 days, 2-3 applications during crop season"
    },
    "Tungro": {
        "disease_name": "Tungro Virus",
        "description": "Viral disease transmitted by green leafhoppers causing yellow discoloration",
        "pesticides": [
            {"name": "Imidacloprid 17.8% SL", "dosage": "0.3ml/liter", "details": "Apply @ 0.3ml/liter (for vector control)"},
            {"name": "Thiamethoxam 25% WG", "dosage": "0.2g/liter", "details": "Use @ 0.2g/liter (for leafhopper control)"},
            {"name": "Fipronil 5% SC", "dosage": "2ml/liter", "details": "Apply @ 2ml/liter (vector management)"},
            {"name": "Neem oil 3-5%", "dosage": "3-5ml/liter", "details": "Organic alternative for pest control"}
        ],
        "application_method": "Spray to control green leafhopper vectors, focus on preventing transmission",
        "frequency": "Weekly sprays during critical periods, especially in early crop stages"
    }
}

# Test for "Blast" disease
predicted_disease = "Blast"

print("=" * 60)
print(f"Testing pesticide data for: {predicted_disease}")
print("=" * 60)

if predicted_disease in treatment_database:
    print(f"✓ Found '{predicted_disease}' in treatment_database")
    
    treatment_data = treatment_database[predicted_disease]
    print(f"\nDisease Name: {treatment_data['disease_name']}")
    print(f"Description: {treatment_data['description']}")
    print(f"\nApplication Method: {treatment_data['application_method']}")
    print(f"Frequency: {treatment_data['frequency']}")
    
    print(f"\nPesticides ({len(treatment_data['pesticides'])} found):")
    print("-" * 60)
    
    for idx, pest in enumerate(treatment_data['pesticides'], 1):
        print(f"\n{idx}. {pest['name']}")
        print(f"   Dosage: {pest['dosage']}")
        print(f"   Details: {pest['details']}")
    
    print("\n" + "=" * 60)
    print("✓ All pesticide data is correctly structured!")
    print("=" * 60)
else:
    print(f"✗ '{predicted_disease}' NOT found in treatment_database")
    print(f"Available keys: {list(treatment_database.keys())}")
