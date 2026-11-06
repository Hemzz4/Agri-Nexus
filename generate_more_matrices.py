import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import confusion_matrix
from sklearn.preprocessing import LabelEncoder
import warnings
warnings.filterwarnings('ignore')

print("Generating alternative visual confusion matrices...")

try:
    # Load data
    df = pd.read_csv('backend/data/Final_Model_Ready_Dataset.csv')
    df = df.dropna()
    
    # Pick a subset of top crops
    top_crops = df['Crop'].value_counts().nlargest(5).index
    df_top = df[df['Crop'].isin(top_crops)]
    
    le_crop = LabelEncoder()
    df_top['Crop_Encoded'] = le_crop.fit_transform(df_top['Crop'])
    
    # Use generic features
    features = ['Temperature', 'Precipitation', 'Humidity', 'Yield']
    X = df_top[features]
    y = df_top['Crop_Encoded']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    clf = RandomForestClassifier(n_estimators=50, random_state=42)
    clf.fit(X_train, y_train)
    y_pred = clf.predict(X_test)
    
    # Calculate confusion matrices
    cm = confusion_matrix(y_test, y_pred)
    cm_normalized = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis] # Normalize by row (True Class)
    
    crop_names = le_crop.classes_
    
    # --- PLOT 1: NORMALIZED PERCENTAGE CONFUSION MATRIX ---
    plt.figure(figsize=(10, 8))
    ax1 = sns.heatmap(cm_normalized, annot=True, fmt='.1%', cmap='Greens', 
                     xticklabels=crop_names, yticklabels=crop_names,
                     annot_kws={"size": 14})
    
    plt.title('Normalized Crop Classification Confusion Matrix', fontsize=18, pad=20)
    plt.ylabel('True Class', fontsize=14, weight='bold')
    plt.xlabel('Predicted Class', fontsize=14, weight='bold')
    plt.xticks(rotation=45, ha='right', fontsize=12)
    plt.yticks(rotation=0, fontsize=12)
    for _, spine in ax1.spines.items():
        spine.set_visible(True); spine.set_linewidth(1)
    
    plt.tight_layout()
    plt.savefig('confusion_matrix_normalized.png', dpi=300, bbox_inches='tight')
    print("Saved: confusion_matrix_normalized.png (Percentage accuracy matrix)")
    
    # --- PLOT 2: ABSTRACT HEATMAP (No Numbers, High-Tech Legal Look) ---
    plt.figure(figsize=(10, 8))
    # We use magma or inferno for a very distinct, publication-ready contrast
    ax2 = sns.heatmap(cm_normalized, annot=False, cmap='magma', 
                     xticklabels=crop_names, yticklabels=crop_names,
                     cbar_kws={'label': 'Prediction Probability'})
    
    plt.title('Predictive Class Separation Heatmap', fontsize=18, pad=20)
    plt.ylabel('True Agricultural Profile', fontsize=14, weight='bold')
    plt.xlabel('AI Predicted Viability', fontsize=14, weight='bold')
    plt.xticks(rotation=45, ha='right', fontsize=12)
    plt.yticks(rotation=0, fontsize=12)
    for _, spine in ax2.spines.items():
        spine.set_visible(True); spine.set_linewidth(1)
        
    plt.tight_layout()
    plt.savefig('confusion_matrix_abstract.png', dpi=300, bbox_inches='tight')
    print("Saved: confusion_matrix_abstract.png (Technical patent drawing visualization)")

except Exception as e:
    print(f"Error generating plots: {e}")
