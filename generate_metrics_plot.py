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

print("Generating visual confusion matrix...")

try:
    # Load data
    df = pd.read_csv('backend/data/Final_Model_Ready_Dataset.csv')
    df = df.dropna()
    
    # We will pick a subset of top crops to make the confusion matrix readable
    top_crops = df['Crop'].value_counts().nlargest(5).index
    df_top = df[df['Crop'].isin(top_crops)]
    
    le_crop = LabelEncoder()
    df_top['Crop_Encoded'] = le_crop.fit_transform(df_top['Crop'])
    
    # Use generic features for a quick model
    features = ['Temperature', 'Precipitation', 'Humidity', 'Yield']
    X = df_top[features]
    y = df_top['Crop_Encoded']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    clf = RandomForestClassifier(n_estimators=50, random_state=42)
    clf.fit(X_train, y_train)
    y_pred = clf.predict(X_test)
    
    # Confusion Matrix
    cm = confusion_matrix(y_test, y_pred)
    crop_names = le_crop.classes_
    
    # Create the plot
    plt.figure(figsize=(10, 8))
    
    # Use seaborn to create a beautiful heatmap
    ax = sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                     xticklabels=crop_names, yticklabels=crop_names,
                     annot_kws={"size": 14})
    
    plt.title('Crop Classification Confusion Matrix', fontsize=18, pad=20)
    plt.ylabel('True Class', fontsize=14, weight='bold')
    plt.xlabel('Predicted Class', fontsize=14, weight='bold')
    plt.xticks(rotation=45, ha='right', fontsize=12)
    plt.yticks(rotation=0, fontsize=12)
    
    # Add a nice border
    for _, spine in ax.spines.items():
        spine.set_visible(True)
        spine.set_linewidth(1)
        
    plt.tight_layout()
    
    # Save the figure
    plt.savefig('confusion_matrix_plot.png', dpi=300, bbox_inches='tight')
    print("Success! Saved visualization as: confusion_matrix_plot.png")
    
except Exception as e:
    print(f"Error generating plot: {e}")
    print("Make sure matplotlib and seaborn are installed (pip install matplotlib seaborn)")
