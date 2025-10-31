import os
from pathlib import Path
from collections import defaultdict
import json

# Define the dataset path
dataset_path = Path(r"c:\Users\gyuva\Downloads\cap\Rice Leaf Disease Images")

def analyze_dataset(dataset_dir):
    """
    Comprehensive analysis of the Rice Leaf Disease Dataset
    """
    analysis = {
        'total_images': 0,
        'disease_categories': {},
        'file_formats': defaultdict(int),
        'image_variants': {}
    }
    
    # Analyze each disease category
    for disease_folder in dataset_dir.iterdir():
        if disease_folder.is_dir():
            disease_name = disease_folder.name
            images = list(disease_folder.glob('*.*'))
            
            # Count images per disease
            analysis['disease_categories'][disease_name] = len(images)
            analysis['total_images'] += len(images)
            
            # Track file formats
            for img in images:
                ext = img.suffix.lower()
                analysis['file_formats'][ext] += 1
            
            # Identify image variants/augmentations
            variants = defaultdict(int)
            for img in images:
                filename = img.stem
                # Check for different naming patterns
                if 'orig' in filename.lower():
                    variants['original'] += 1
                elif 'rotated' in filename.lower():
                    variants['rotated'] += 1
                elif filename.count('_') >= 1:
                    # Extract variant number (e.g., BACTERIALBLIGHT1, BLAST2, etc.)
                    parts = filename.split('_')[0]
                    # Extract variant identifier
                    import re
                    match = re.search(r'(\d+)$', parts)
                    if match:
                        variant_num = match.group(1)
                        variants[f'variant_{variant_num}'] += 1
                    else:
                        variants['standard'] += 1
                else:
                    variants['standard'] += 1
            
            analysis['image_variants'][disease_name] = dict(variants)
    
    return analysis

def print_analysis(analysis):
    """
    Print formatted analysis report
    """
    print("=" * 70)
    print("RICE LEAF DISEASE DATASET ANALYSIS")
    print("=" * 70)
    print()
    
    print(f"📊 OVERALL STATISTICS")
    print("-" * 70)
    print(f"Total Images: {analysis['total_images']:,}")
    print(f"Number of Disease Categories: {len(analysis['disease_categories'])}")
    print()
    
    print(f"📁 DISEASE CATEGORIES BREAKDOWN")
    print("-" * 70)
    for disease, count in sorted(analysis['disease_categories'].items()):
        percentage = (count / analysis['total_images']) * 100
        print(f"{disease:20s}: {count:4d} images ({percentage:5.2f}%)")
    print()
    
    print(f"📷 FILE FORMAT DISTRIBUTION")
    print("-" * 70)
    for fmt, count in sorted(analysis['file_formats'].items(), key=lambda x: x[1], reverse=True):
        percentage = (count / analysis['total_images']) * 100
        print(f"{fmt:10s}: {count:4d} images ({percentage:5.2f}%)")
    print()
    
    print(f"🔄 IMAGE VARIANTS BY DISEASE")
    print("-" * 70)
    for disease, variants in sorted(analysis['image_variants'].items()):
        print(f"\n{disease}:")
        # Count unique variant types
        variant_types = set()
        for var_name in variants.keys():
            if 'variant_' in var_name:
                variant_types.add(var_name)
        
        if 'original' in variants:
            print(f"  - Original images: {variants['original']}")
        if 'rotated' in variants:
            print(f"  - Rotated images: {variants['rotated']}")
        if variant_types:
            print(f"  - Number of variant sets: {len(variant_types)}")
            for var in sorted(variant_types):
                print(f"    • {var}: {variants[var]} images")
    print()
    
    print(f"📈 DATASET BALANCE ANALYSIS")
    print("-" * 70)
    counts = list(analysis['disease_categories'].values())
    max_count = max(counts)
    min_count = min(counts)
    avg_count = sum(counts) / len(counts)
    
    print(f"Maximum images per class: {max_count}")
    print(f"Minimum images per class: {min_count}")
    print(f"Average images per class: {avg_count:.2f}")
    print(f"Class imbalance ratio: {max_count/min_count:.2f}:1")
    
    # Calculate balance status
    if max_count / min_count < 1.2:
        balance_status = "Well-balanced ✓"
    elif max_count / min_count < 1.5:
        balance_status = "Moderately balanced"
    else:
        balance_status = "Imbalanced - consider rebalancing"
    
    print(f"Balance Status: {balance_status}")
    print()
    
    print("=" * 70)
    print("RECOMMENDATIONS")
    print("=" * 70)
    print()
    print("1. Data Splitting:")
    print("   - Train: 70-80% of data")
    print("   - Validation: 10-15% of data")
    print("   - Test: 10-15% of data")
    print()
    print("2. Preprocessing Suggestions:")
    print("   - Resize images to consistent dimensions (e.g., 224x224, 256x256)")
    print("   - Normalize pixel values (0-1 or standardize)")
    print("   - Consider additional augmentation (if needed):")
    print("     • Random horizontal/vertical flips")
    print("     • Random brightness/contrast adjustments")
    print("     • Random zoom")
    print()
    print("3. Model Suggestions:")
    print("   - Transfer learning with pre-trained CNNs (ResNet, EfficientNet, VGG)")
    print("   - Custom CNN architecture")
    print("   - Ensemble methods for better accuracy")
    print()
    print("4. Evaluation Metrics:")
    print("   - Accuracy")
    print("   - Precision, Recall, F1-Score (per class)")
    print("   - Confusion Matrix")
    print("   - ROC-AUC curves")
    print()
    print("=" * 70)

if __name__ == "__main__":
    # Run analysis
    analysis_results = analyze_dataset(dataset_path)
    
    # Print report
    print_analysis(analysis_results)
    
    # Save to JSON
    output_file = dataset_path.parent / "dataset_analysis.json"
    with open(output_file, 'w') as f:
        json.dump(analysis_results, f, indent=2)
    
    print(f"\n💾 Analysis saved to: {output_file}")
